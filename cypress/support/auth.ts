// Shared setup for the auth specs. Test users get @resend.dev "delivered" addresses
// so any email the app sends them (reset links, passkey alerts) lands in Resend's
// test sink instead of bouncing.

export const PASSWORD = "Cypress-Test-123"

export const uniqueEmail = (tag: string) =>
  `delivered+${tag}-${Date.now()}-${Cypress._.random(1e6)}@resend.dev`

/** Call in beforeEach: hides the cookie banner and the "What's New" modal, which would cover the forms. */
export function prepareBrowser() {
  cy.setCookie("cookie_consent", "necessary")
  // components/updates/modal-provider.tsx
  cy.on("window:before:load", (win) => {
    win.localStorage.setItem(
      "appUpdateInfo",
      JSON.stringify({ version: Cypress.expose("APP_VERSION"), closed: true }),
    )
  })
}

/** POST to better-auth directly. Origin is required by its CSRF check. */
export function authApi(path: string, body: object = {}, headers: Record<string, string> = {}) {
  return cy.request({
    method: "POST",
    url: `/api/auth${path}`,
    body,
    headers: { Origin: Cypress.config("baseUrl")!, ...headers },
    failOnStatusCode: false,
  })
}

/** Creates a user through the API; leaves the browser signed in as them. */
export function createUser(email: string, password = PASSWORD) {
  return authApi("/sign-up/email", { name: "Cypress User", email, password }).its("status").should("eq", 200)
}

export function signOutApi() {
  return authApi("/sign-out")
}

export function fillLogin(email: string, password: string) {
  cy.get("#email").type(email)
  cy.get("#password").type(password, { log: false })
  cy.get("form button[type=submit]").click()
}

export function expectToast(text: string | RegExp) {
  cy.contains("[data-sonner-toast]", text, { timeout: 10000 }).should("be.visible")
}

export function expectPath(pathname: string) {
  cy.location("pathname", { timeout: 20000 }).should("eq", pathname)
}
