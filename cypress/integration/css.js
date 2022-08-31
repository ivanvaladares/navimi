describe('css', () => {

    it('test css injection', () => {
  
      cy.visit('http://localhost:3000');
      cy.get('h1').should('contain', 'Home...');

      cy.get("nav").find('a[href="/css-test"]').should('not.be.visible');
      
      cy.get("nav").find('a[href="/about"]').click();
      cy.get('h1').should('contain', 'About...');

      cy.get("nav").find('a[href="/css-test"]').should('be.visible');

      cy.get("nav").find('a[href="/css-test"]').click();
      cy.get('h1').should('contain', 'Css test...');
      cy.get("nav").find('a[href="/css-test"]').should('not.be.visible');

      cy.get("nav").find('a[href="/about"]').click();
      cy.get('h1').should('contain', 'About...');
      cy.get("nav").find('a[href="/css-test"]').should('not.be.visible');

    });
  
  });