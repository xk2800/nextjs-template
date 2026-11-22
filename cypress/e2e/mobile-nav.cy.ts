import { createUser, expectPath, prepareBrowser, uniqueEmail } from "../support/auth"

// Passes for any MOBILE_NAV setting with a bottom bar in the top-bar layout (app/dashboard/layout.tsx); the sidebar test adapts to what is shown.
describe("mobile navigation", () => {
  const nav = 'nav[aria-label="Primary"]'

  before(() => cy.task("clearThrottle")) // each test signs up a user, and sign-ups count toward the throttle

  beforeEach(() => {
    prepareBrowser()
    createUser(uniqueEmail("mobilenav"))
    cy.setCookie("nav-style", "topbar")
  })

  it("shows the bottom bar on a phone, marks the current tab and navigates", () => {
    cy.viewport(390, 844)
    cy.visit("/dashboard")
    cy.get(nav).should("be.visible")
    cy.get(nav).contains("a", "Overview").should("have.attr", "aria-current", "page")
    cy.get(nav).contains("a", "Settings").click()
    expectPath("/dashboard/settings")
    cy.get(nav).contains("a", "Settings").should("have.attr", "aria-current", "page")
  })

  it("keeps the last content clear of the bar", () => {
    cy.viewport(390, 844)
    cy.visit("/dashboard")
    cy.scrollTo("bottom")
    cy.get(nav).then(($nav) => {
      const top = $nav[0].getBoundingClientRect().top
      cy.get("body *:visible").last().then(($el) => {
        expect($el[0].getBoundingClientRect().bottom).to.be.at.most(top + 1)
      })
    })
  })

  it("hides the bottom bar on desktop", () => {
    cy.viewport(1280, 800)
    cy.visit("/dashboard")
    cy.get(nav).should("not.be.visible")
  })

  it("sidebar layout: the bottom bar, when shown, is the only mobile navigation", () => {
    cy.setCookie("nav-style", "sidebar")
    cy.viewport(390, 844)
    cy.visit("/dashboard")
    cy.get("body").then(($body) => {
      const bottomBar = $body.find(nav).filter(":visible").length > 0
      cy.get('[data-sidebar="trigger"]').should(bottomBar ? "not.be.visible" : "be.visible")
      if (bottomBar) cy.contains("button", "Logout").should("be.visible")
    })
    cy.viewport(1280, 800)
    cy.get('[data-sidebar="trigger"]').should("be.visible")
    // Desktop uses the sidebar footer's own log-out, never the header one.
    cy.get("body").find("button:visible").filter(":contains(Logout)").should("have.length", 0)
  })
})
