import {
  PASSWORD, authApi, createUser, expectPath, expectToast, fillLogin, prepareBrowser, signOutApi, uniqueEmail,
} from "../support/auth"

describe("two-factor login", () => {
  const email = uniqueEmail("2fa")
  let secret = ""
  let backupCodes: string[] = []

  // Turns on TOTP the way the settings page does: enable, then confirm with a first code.
  before(() => {
    cy.task("clearThrottle")
    createUser(email)
    authApi("/two-factor/enable", { password: PASSWORD }).then((res) => {
      expect(res.status).to.eq(200)
      secret = new URL(res.body.totpURI).searchParams.get("secret")!
      backupCodes = res.body.backupCodes
      cy.task<string>("totp", secret).then((code) =>
        authApi("/two-factor/verify-totp", { code }).its("status").should("eq", 200),
      )
    })
    signOutApi()
  })
  beforeEach(prepareBrowser)

  it("asks for a code after the password, then follows callbackUrl", () => {
    cy.visit("/login?callbackUrl=%2Fdashboard%2Fsettings")
    fillLogin(email, PASSWORD)
    expectPath("/login/2fa")
    cy.location("search").should("eq", "?callbackUrl=%2Fdashboard%2Fsettings")
    cy.task<string>("totp", secret).then((code) => cy.get("#code").type(code))
    cy.contains("button", "Verify").click()
    expectPath("/dashboard/settings")
  })

  it("rejects a wrong code", () => {
    cy.visit("/login")
    fillLogin(email, PASSWORD)
    expectPath("/login/2fa")
    cy.get("#code").type("000000")
    cy.contains("button", "Verify").click()
    expectToast(/invalid/i)
    cy.location("pathname").should("eq", "/login/2fa")
  })

  it("accepts a backup code", () => {
    cy.visit("/login")
    fillLogin(email, PASSWORD)
    expectPath("/login/2fa")
    cy.contains("button", "Use a backup code instead").click()
    cy.contains("label", "Backup code")
    cy.get("#code").type(backupCodes[0])
    cy.contains("button", "Verify").click()
    expectPath("/dashboard")
  })

  it("skips the code on a trusted device", () => {
    cy.visit("/login")
    fillLogin(email, PASSWORD)
    expectPath("/login/2fa")
    cy.contains("button", "Use a backup code instead").click()
    cy.get('[role="checkbox"]').click()
    cy.get("#code").type(backupCodes[1])
    cy.contains("button", "Verify").click()
    expectPath("/dashboard")

    signOutApi() // keeps the trust-device cookie
    cy.visit("/login")
    fillLogin(email, PASSWORD)
    expectPath("/dashboard")
  })
})
