describe('Path', () => {

    it('successfully parse path values and querystring', () => {
  
      cy.visit('http://localhost:3000');
      cy.get('h1').should('contain', 'Home...');

      cy.get("nav").find('a[href="/path-test/value1/value2"]').click();
      cy.get('h1').should('contain', 'Path test...');
      cy.get('#p1').should('contain', 'p1: value1');
      cy.get('#p2').should('contain', 'p2: value2');

      cy.window().then((win) => {
        win.eval('navigateTo("/path-test/1/2")');
        cy.get('#p1').should('contain', 'p1: 1');
        cy.get('#p2').should('contain', 'p2: 2');
      });
  
      cy.window().then((win) => {
        win.eval('navigateTo("/path-test/1/2?q1=3")');
        cy.get('#p1').should('contain', 'p1: 1');
        cy.get('#p2').should('contain', 'p2: 2');
        cy.get('#q1').should('contain', 'q1: 3');
        cy.get('#q2').should('contain', 'q2: undefined');
      });

      cy.window().then((win) => {
        win.eval('navigateTo("/path-test/1/2?q1=3&q2=4")');
        cy.get('#p1').should('contain', 'p1: 1');
        cy.get('#p2').should('contain', 'p2: 2');
        cy.get('#q1').should('contain', 'q1: 3');
        cy.get('#q2').should('contain', 'q2: 4');
      });

      cy.window().then((win) => {
        win.eval('navigateTo("/path-test/value1/value2?notFound=yes")');
        cy.get('h2').should('contain', 'Page not found!!!');
      });

    });
  
  });