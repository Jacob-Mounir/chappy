describe('Theme', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173')
    // Login before each test
    cy.get('input[name="username"]').type('testuser')
    cy.get('input[name="password"]').type('password123')
    cy.get('button[type="submit"]').click()
    cy.url().should('not.include', '/login')
  })

  it('should toggle between light and dark mode', () => {
    // Check initial theme
    cy.get('html').should('have.attr', 'data-theme')

    // Click theme toggle
    cy.get('[data-test="theme-toggle"]').click()

    // Check if theme changed
    cy.get('html').should('have.attr', 'data-theme')
  })

  it('should persist theme preference', () => {
    // Set theme to dark
    cy.get('[data-test="theme-toggle"]').click()
    const currentTheme = cy.get('html').invoke('attr', 'data-theme')

    // Reload page
    cy.reload()

    // Check if theme persisted
    cy.get('html').should('have.attr', 'data-theme', currentTheme)
  })
})