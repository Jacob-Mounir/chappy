describe('Channels', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173')
    // Login before each test
    cy.get('input[name="username"]').type('testuser')
    cy.get('input[name="password"]').type('password123')
    cy.get('button[type="submit"]').click()
    cy.url().should('not.include', '/login')
  })

  it('should show channel list', () => {
    cy.contains('Kanaler')
    cy.get('[data-test="channel-list"]').should('exist')
  })

  it('should create a new channel', () => {
    cy.get('[data-test="create-channel-button"]').click()
    cy.get('input[name="channelName"]').type(`testchannel${Date.now()}`)
    cy.get('button[type="submit"]').click()
    cy.contains('testchannel')
  })

  it('should join a channel', () => {
    cy.get('[data-test="channel-list"]')
      .contains('testchannel')
      .click()
    cy.get('[data-test="message-input"]').should('exist')
  })

  it('should send a message in channel', () => {
    const testMessage = `Test message ${Date.now()}`
    cy.get('[data-test="message-input"]').type(testMessage)
    cy.get('[data-test="send-message-button"]').click()
    cy.contains(testMessage)
  })
})
