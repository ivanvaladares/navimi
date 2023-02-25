import cypress from 'cypress';
import path from 'path';
import express from 'express';
import http from 'http';

const app = express();
const server = http.createServer(app);

const __dirname = path.resolve();

app.use(express.static(path.resolve(__dirname, './cypress/site')));

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, './cypress/site/index.html'));
});

server.listen(3000, () => {
  console.log(`Cypress test starting on port ${server.address().port}...`);
  cypress.run().finally(() => {
    server.close(() => {
      console.log('Closed out remaining connections');
      process.exit(0);
    });
  });
});