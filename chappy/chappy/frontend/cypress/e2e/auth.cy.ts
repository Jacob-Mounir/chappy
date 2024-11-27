describe('Authentication', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173')
  })

  it('should show login page by default', () => {
    cy.url().should('include', '/login')
    cy.get('h1').should('contain', 'Logga in')
  })

  it('should register a new user', () => {
    cy.visit('http://localhost:5173/register')
    cy.get('input[name="username"]').type(`testuser${Date.now()}`)
    cy.get('input[name="email"]').type(`test${Date.now()}@example.com`)
    cy.get('input[name="password"]').type('password123')
    cy.get('button[type="submit"]').click()
    cy.url().should('not.include', '/register')
  })

  it('should login with correct credentials', () => {
    cy.get('input[name="username"]').type('testuser')
    cy.get('input[name="password"]').type('password123')
    cy.get('button[type="submit"]').click()
    cy.url().should('not.include', '/login')
  })

  it('should show error with incorrect credentials', () => {
    cy.get('input[name="username"]').type('wronguser')
    cy.get('input[name="password"]').type('wrongpass')
    cy.get('button[type="submit"]').click()
    cy.contains('Fel användarnamn eller lösenord')
  })
})
