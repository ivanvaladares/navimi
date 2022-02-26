describe('Load', () => {

    it('successfully loads', () => {
  
      cy.visit('http://localhost:3000');
      cy.get('h1').should('contain', 'Home...');
  
      cy.visit('http://localhost:3000/about');
      cy.get('h1').should('contain', 'About...');
      
      cy.visit('http://localhost:3000/contact');
      cy.get('h1').should('contain', 'Contact...');
  
      cy.visit('http://localhost:3000/libs-test');
      cy.get('h1').should('contain', 'Libs test...');
      cy.get('p').should('contain', 'Date: 26-05-1981 12:34:56');

      cy.visit('http://localhost:3000/someError');
      cy.get('h2').should('contain', 'Page not found!!!');
  
    });
  
  });