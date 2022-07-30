describe('State', () => {

    it('successfully set, react and maintain state', () => {
  
      cy.visit('http://localhost:3000')
      cy.get('h1').should('contain', 'Home...')

      cy.get("nav").find('a[href="/state-test"]').click()
      cy.get('h1').should('contain', 'State test...')
  
      cy.get('.counter').should('contain', '0')

      cy.get('body').find('.counter_btn').click()
      cy.get('.counter').should('contain', '1')

      cy.go("back")
      cy.get('h1').should('contain', 'Home...')
  
      cy.go("forward")
      cy.get('.counter').should('contain', '1')

      cy.get('body').find('.counter_btn').click()
      cy.get('.counter').should('contain', '2')
  
      cy.get('body').find('.counter_btn').click()
      cy.get('body').find('.counter_btn').click()
      cy.get('.counter').should('contain', '4')

    });
  
  })