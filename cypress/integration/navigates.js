describe('Navigate', () => {

    it('successfully navigates', () => {
  
      cy.visit('http://localhost:3000');
      cy.get('h1').should('contain', 'Home...');
  
      cy.get("nav").find('a[href="/about"]').click();
      cy.get('h1').should('contain', 'About...');
  
      cy.get("nav").find('a[href="/contact"]').click();
      cy.get('h1').should('contain', 'Contact...');

      cy.get("nav").find('a[href="/libs-test"]').click();
      cy.get('h1').should('contain', 'Libs test...');
      cy.get('p').should('contain', 'Date: 26-05-1981 12:34:56');

      cy.window().then((win) => {
        win.eval('navigateTo("/someError")');
        cy.get('h2').should('contain', 'Page not found!!!');
      });
  
      cy.go("back");
      cy.get('h1').should('contain', 'Libs test...');
  
      cy.go("back");
      cy.get('h1').should('contain', 'Contact...');
  
      cy.go("back");
      cy.get('h1').should('contain', 'About...');
  
      cy.go("forward");
      cy.get('h1').should('contain', 'Contact...');
  
    });
  
  });