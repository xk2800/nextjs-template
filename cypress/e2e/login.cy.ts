import {
  PASSWORD, authApi, createUser, expectPath, expectToast, fillLogin, prepareBrowser, uniqueEmail,
} from "../support/auth"

describe("login", () => {
  const email = uniqueEmail("login")

  before(() => {
    cy.task("clearThrottle")
    createUser(email)
    cy.clearCookies() // before() cookies leak into the first test
  })
  beforeEach(prepareBrowser)
  after(() => cy.task("clearThrottle"))

  it("shows validation errors on an empty form", () => {
    cy.visit("/login")
    cy.get("form button[type=submit]").click()
    cy.get("#email-error").should("be.visible")
    cy.get("#password-error").should("contain", "at least 6 characters")
  })

  it("rejects a wrong password", () => {
    cy.visit("/login")
    fillLogin(email, "wrong-password-123")
    expectToast(/invalid email or password/i)
    cy.location("pathname").should("eq", "/login")
  })

  it("rejects an unknown email", () => {
    cy.visit("/login")
    fillLogin(uniqueEmail("nobody"), PASSWORD)
    expectToast(/invalid email or password/i)
  })

  it("logs in and lands on the dashboard", () => {
    cy.visit("/login")
    fillLogin(email, PASSWORD)
    expectPath("/dashboard")
  })

  it("sends a signed-out visitor to login, then back to the page they wanted", () => {
    cy.visit("/dashboard/settings")
    expectPath("/login")
    cy.location("search").should("contain", "callbackUrl=")
    fillLogin(email, PASSWORD)
    expectPath("/dashboard/settings")
  })

  it("ignores an off-site callbackUrl", () => {
    cy.visit("/login?callbackUrl=https%3A%2F%2Fevil.example.com")
    fillLogin(email, PASSWORD)
    expectPath("/dashboard")
  })

  it("redirects a signed-in user away from login, signup and forgot-password", () => {
    cy.visit("/login")
    fillLogin(email, PASSWORD)
    expectPath("/dashboard")
    for (const page of ["/login", "/signup", "/forgot-password"]) {
      cy.visit(page)
      expectPath("/dashboard")
    }
  })

  it("logs out", () => {
    cy.visit("/login")
    fillLogin(email, PASSWORD)
    expectPath("/dashboard")
    cy.get('[aria-label="Log out"]:visible').first().click()
    expectPath("/")
    cy.visit("/dashboard")
    expectPath("/login")
  })

  it("blocks a banned user", () => {
    const banned = uniqueEmail("banned")
    createUser(banned)
    cy.clearCookies()
    cy.setCookie("cookie_consent", "necessary")
    cy.task("banUser", banned)
    cy.visit("/login")
    fillLogin(banned, PASSWORD)
    expectToast(/banned/i)
    cy.location("pathname").should("eq", "/login")
  })

  it("shows friendly messages for ?error= codes", () => {
    cy.visit("/login?error=account_banned")
    cy.contains("This account has been suspended.")
    cy.visit("/login?error=account_not_linked")
    cy.contains("An account with this email already exists.")
    cy.visit("/login?error=something_else")
    cy.contains("Sign-in was interrupted. Please try again.")
  })

  it("toggles password visibility", () => {
    cy.visit("/login")
    cy.get('[aria-label="Show password"]').click()
    cy.get("#password").should("have.attr", "type", "text")
  })

  it("links to forgot-password and signup (keeping callbackUrl)", () => {
    cy.visit("/login?callbackUrl=%2Fdashboard%2Fsettings")
    cy.contains("a", "Forgot password?").should("have.attr", "href", "/forgot-password")
    cy.contains("a", "Sign up").click()
    expectPath("/signup")
    cy.location("search").should("eq", "?callbackUrl=%2Fdashboard%2Fsettings")
  })

  it("starts Google sign-in with the callbackUrl", () => {
    cy.intercept("POST", "/api/auth/sign-in/social", (req) => {
      expect(req.body.provider).to.eq("google")
      expect(req.body.callbackURL).to.eq("/dashboard/settings")
      req.reply({ url: "/login?google=stubbed", redirect: true })
    }).as("social")
    cy.visit("/login?callbackUrl=%2Fdashboard%2Fsettings")
    cy.contains("button", "Sign in with Google").click()
    cy.wait("@social")
    cy.location("search").should("include", "google=stubbed")
  })

  it("throttles a device after 10 failed sign-ins", () => {
    const device = { "x-device-fingerprint": `cypress-${Date.now()}` }
    const attempt = () => authApi("/sign-in/email", { email, password: "wrong-password-123" }, device)
    Cypress._.times(10, () => attempt().its("status").should("eq", 401))
    attempt().its("status").should("eq", 429)
    // The right password is refused too while throttled.
    authApi("/sign-in/email", { email, password: PASSWORD }, device).its("status").should("eq", 429)
  })
})
