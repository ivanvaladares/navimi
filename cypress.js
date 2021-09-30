const cypress = require('cypress')
const path = require('path');
const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);

app.use(express.static(path.resolve(__dirname, "cypress/site")));

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, "cypress/site/index.html"));
});

server.listen(3000, () => {
  console.log(`Server started on port ${server.address().port} :)`);
  cypress.run().finally(() => {
    server.close(() => {
      console.log('Closed out remaining connections');
      process.exit(0);
    });
  });
});