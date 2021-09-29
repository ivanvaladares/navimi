const path = require('path');
const express = require('express');
const chokidar = require('chokidar');
const fs = require('fs');
const http = require('http');
const WebSocket = require('ws');

//******* Express and WS **********/

process.on('uncaughtException', function (err) {
  console.log(err);
});

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ message: "HOT connected!" }));
});

app.use(express.static(path.resolve(__dirname + "/")));

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, "index.html"));
});

server.listen(process.env.PORT || 5000, () => {
  console.log(`Server started on port ${server.address().port} :)`);
});


//******* HOT **********/

const watcher = chokidar.watch(path.resolve(__dirname), {
  persistent: true,
  depth: 10,
  awaitWriteFinish: {
    stabilityThreshold: 100,
    pollInterval: 100
  },
});

watcher
  .on('ready', () => {
    console.log("ready");
  })
  .on('change', path => { setTimeout(sendFile, 100, path); })
  .on('error', error => {
    if (error.message != "EPERM: operation not permitted, watch") {
      console.error(error.message);
    }
  });

const sendFile = async (filePath) => {
  try {
    const fileContents = await readFile(filePath);

    filePath = filePath.substr(filePath.indexOf(__dirname) + __dirname.length);

    wss.clients.forEach(client => {
        client.send(JSON.stringify({ filePath, data: fileContents }));
    });

  } catch (error) {
    //ignore
  }
};

const readFile = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        reject(err);
      }
      else {
        resolve(data);
      }
    });
  });
};
