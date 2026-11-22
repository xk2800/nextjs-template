import { createUser, prepareBrowser, uniqueEmail } from "../support/auth"

// Needs the dev server started with NAV_DEMO_CONTROLS=true; skipped otherwise.
describe("demo site: visitor-chosen mobile navigation", () => {
  const nav = 'nav[aria-label="Primary"]'
  const pick = (label: string) => {
    cy.get('[aria-label="Mobile navigation style"]').click()
    cy.contains('[role="menuitemradio"]', label).click()
  }

  before(() => cy.task("clearThrottle")) // each test signs up a user, and sign-ups count toward the throttle

  beforeEach(function () {
    prepareBrowser()
    createUser(uniqueEmail("navdemo"))
    cy.viewport(390, 844)
    cy.setCookie("nav-style", "topbar")
    cy.visit("/dashboard")
    cy.get("body").then(($b) => {
      if (!$b.find('[aria-label="Mobile navigation style"]').length) this.skip()
    })
  })

  it("switches between tabs, dock and off, and remembers the choice", () => {
    pick("Dock")
    cy.getCookie("mobile-nav").should("have.property", "value", "dock")
    cy.get(nav).should("be.visible").and("have.class", "rounded-3xl")
    cy.reload()
    cy.get(nav).should("have.class", "rounded-3xl")

    pick("Tabs")
    cy.get(nav).should("be.visible").and("not.have.class", "rounded-3xl")

    pick("Off")
    cy.get(nav).should("not.exist")
  })

  it("sidebar layout: Tabs and Dock replace the menu button, Off brings it back", () => {
    cy.setCookie("nav-style", "sidebar")
    cy.visit("/dashboard")
    pick("Tabs")
    cy.get(nav).should("be.visible").and("not.have.class", "rounded-3xl")
    cy.get('[data-sidebar="trigger"]').should("not.be.visible")
    cy.contains("button", "Logout").should("be.visible")
    pick("Dock")
    cy.get(nav).should("have.class", "rounded-3xl")
    cy.get('[data-sidebar="trigger"]').should("not.be.visible")
    pick("Off")
    cy.get(nav).should("not.exist")
    cy.get('[data-sidebar="trigger"]').should("be.visible")
  })

  it("ignores a junk cookie value", () => {
    cy.setCookie("mobile-nav", "garbage")
    cy.visit("/dashboard")
    cy.get("body").should("be.visible")
    cy.get('[aria-label="Mobile navigation style"]').should("exist")
  })
})
