import { createUser, expectPath, expectToast, prepareBrowser, signOutApi, uniqueEmail } from "../support/auth"

// Uses Chrome's virtual WebAuthn authenticator over CDP, so Chromium browsers only (Chrome, Edge, Electron).
function cdp(command: string, params: object = {}) {
  return cy.wrap(Cypress.automation("remote:debugger:protocol", { command, params }), { log: false })
}

describe("passkey login", () => {
  before(function () {
    if (Cypress.browser.family !== "chromium") this.skip()
    cy.task("clearThrottle")
  })
  beforeEach(prepareBrowser)

  it("registers a passkey in settings and signs in with it", () => {
    cdp("WebAuthn.enable")
    cdp("WebAuthn.addVirtualAuthenticator", {
      options: {
        protocol: "ctap2",
        transport: "internal",
        hasResidentKey: true,
        hasUserVerification: true,
        isUserVerified: true,
        automaticPresenceSimulation: true,
      },
    })

    createUser(uniqueEmail("passkey"))
    cy.visit("/dashboard/settings?tab=security")
    cy.contains("button", "Add a passkey").click()
    expectToast("Passkey registered")

    signOutApi()
    cy.visit("/login")
    cy.contains("button", "Sign in with a passkey").click()
    expectPath("/dashboard")
  })
})
