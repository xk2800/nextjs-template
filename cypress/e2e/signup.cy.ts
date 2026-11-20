import { PASSWORD, expectPath, expectToast, prepareBrowser, uniqueEmail } from "../support/auth"

describe("signup", () => {
  before(() => cy.task("clearThrottle"))
  beforeEach(prepareBrowser)

  function fillSignup(email: string, password = PASSWORD) {
    cy.get("#name").type("Cypress User")
    cy.get("#email").type(email)
    cy.get("#password").type(password, { log: false })
    cy.get("form button[type=submit]").click()
  }

  it("shows validation errors on an empty form", () => {
    cy.visit("/signup")
    cy.get("form button[type=submit]").click()
    cy.get("#name-error").should("contain", "Name is required.")
    cy.get("#email-error").should("be.visible")
    cy.get("#password-error").should("contain", "at least 8 characters")
    cy.get("#name").type("A")
    cy.get("#name-error").should("not.exist")
  })

  it("rates password strength as you type", () => {
    cy.visit("/signup")
    cy.get("#password-hint").should("have.text", "Use 8+ characters")
    cy.get("#password").type("abcdefgh")
    cy.get("#password-hint").should("have.text", "Weak")
    cy.get("#password").clear().type("Abcdefgh1")
    cy.get("#password-hint").should("have.text", "Good")
    cy.get("#password").clear().type("Abcdefgh1234!")
    cy.get("#password-hint").should("have.text", "Strong")
  })

  it("toggles password visibility", () => {
    cy.visit("/signup")
    cy.get("#password").should("have.attr", "type", "password")
    cy.get('[aria-label="Show password"]').click()
    cy.get("#password").should("have.attr", "type", "text")
    cy.get('[aria-label="Hide password"]').click()
    cy.get("#password").should("have.attr", "type", "password")
  })

  it("registers a new account and lands on the dashboard", () => {
    cy.visit("/signup")
    fillSignup(uniqueEmail("signup"))
    expectPath("/dashboard")
  })

  it("rejects an email that is already registered", () => {
    const email = uniqueEmail("dup")
    cy.visit("/signup")
    fillSignup(email)
    expectPath("/dashboard")
    cy.clearCookies()
    cy.setCookie("cookie_consent", "necessary")
    cy.visit("/signup")
    fillSignup(email)
    expectToast(/already exists/i)
    cy.location("pathname").should("eq", "/signup")
  })

  it("follows callbackUrl after signup", () => {
    cy.visit("/signup?callbackUrl=%2Fdashboard%2Fsettings")
    fillSignup(uniqueEmail("cb"))
    expectPath("/dashboard/settings")
  })

  it("links to login (keeping callbackUrl), terms and privacy", () => {
    cy.visit("/signup?callbackUrl=%2Fdashboard%2Fsettings")
    cy.contains("a", "Terms").should("have.attr", "href", "/terms")
    cy.contains("a", "Privacy Policy").should("have.attr", "href", "/privacy")
    cy.contains("a", "Log in").click()
    expectPath("/login")
    cy.location("search").should("eq", "?callbackUrl=%2Fdashboard%2Fsettings")
  })

  it("starts Google sign-up", () => {
    cy.intercept("POST", "/api/auth/sign-in/social", (req) => {
      expect(req.body.provider).to.eq("google")
      req.reply({ url: "/signup?google=stubbed", redirect: true })
    }).as("social")
    cy.visit("/signup")
    cy.contains("button", "Sign up with Google").click()
    cy.wait("@social")
    cy.location("search").should("include", "google=stubbed")
  })
})
