import {
  PASSWORD, createUser, expectPath, expectToast, fillLogin, prepareBrowser, signOutApi, uniqueEmail,
} from "../support/auth"

describe("password reset", () => {
  before(() => cy.task("clearThrottle"))
  beforeEach(prepareBrowser)

  it("confirms without revealing whether the account exists", () => {
    const email = uniqueEmail("nobody")
    cy.visit("/forgot-password")
    cy.get("#email").type(email)
    cy.get("form button[type=submit]").click()
    cy.contains(`If an account exists for ${email}`)
  })

  it("links back to login", () => {
    cy.visit("/forgot-password")
    cy.contains("a", "Back to login").click()
    expectPath("/login")
  })

  it("shows the expired page for a missing or invalid link", () => {
    cy.visit("/reset-password")
    cy.contains("Link expired")
    cy.visit("/reset-password?error=INVALID_TOKEN")
    cy.contains("Link expired")
    cy.contains("a", "Request a new link").should("have.attr", "href", "/forgot-password")
  })

  it("validates the new password", () => {
    cy.visit("/reset-password?token=not-checked-yet")
    cy.get("#password").type("short")
    cy.get("#confirmPassword").type("different")
    cy.get("form button[type=submit]").click()
    cy.get("#password-error").should("contain", "at least 8 characters")
    cy.get("#confirm-password-error").should("contain", "Passwords do not match")
  })

  it("rejects a bogus token", () => {
    cy.visit("/reset-password?token=bogus-token")
    cy.get("#password").type("New-Password-456")
    cy.get("#confirmPassword").type("New-Password-456")
    cy.get("form button[type=submit]").click()
    expectToast(/invalid|expired/i)
  })

  it("resets the password from the emailed link", () => {
    const email = uniqueEmail("reset")
    const newPassword = "New-Password-456"
    createUser(email)
    signOutApi()
    cy.clearCookies()
    cy.setCookie("cookie_consent", "necessary")

    cy.visit("/forgot-password")
    cy.get("#email").type(email)
    cy.get("form button[type=submit]").click()
    cy.contains(`If an account exists for ${email}`)

    cy.task<string | null>("resetToken", email).then((token) => {
      expect(token, "reset token in DB").to.be.a("string")
      cy.visit(`/reset-password?token=${token}`)
    })
    cy.get("#password").type(newPassword)
    cy.get("#confirmPassword").type(newPassword)
    cy.get("form button[type=submit]").click()
    expectPath("/login")
    expectToast("Password reset")

    fillLogin(email, PASSWORD)
    expectToast(/invalid email or password/i)
    cy.get("#password").clear().type(newPassword)
    cy.get("form button[type=submit]").click()
    expectPath("/dashboard")
  })
})
