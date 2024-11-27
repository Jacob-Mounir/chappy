describe('Direct Messages', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173')
    // Login before each test
    cy.get('input[name="username"]').type('testuser')
    cy.get('input[name="password"]').type('password123')
    cy.get('button[type="submit"]').click()
    cy.url().should('not.include', '/login')
  })

  it('should show direct messages section', () => {
    cy.contains('Direktmeddelanden')
    cy.get('[data-test="dm-list"]').should('exist')
  })

  it('should start a new conversation', () => {
    cy.get('[data-test="new-conversation-button"]').click()
    cy.get('[data-test="user-list"]').should('exist')
    cy.get('[data-test="user-list"]').contains('testuser2').click()
    cy.get('[data-test="message-input"]').should('exist')
  })

  it('should send a direct message', () => {
    const testMessage = `DM test ${Date.now()}`
    cy.get('[data-test="dm-list"]').contains('testuser2').click()
    cy.get('[data-test="message-input"]').type(testMessage)
    cy.get('[data-test="send-message-button"]').click()
    cy.contains(testMessage)
  })

  it('should show online status', () => {
    cy.get('[data-test="dm-list"]')
      .contains('testuser2')
      .parent()
      .find('[data-test="online-status"]')
      .should('exist')
  })
})
