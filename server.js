
const express = require('express');
const bodyParser = require('body-parser')
const cors = require('cors')
const path = require('path')
const app = express();
const port = 3000;
const fs = require('fs');


//Middleware
app.use(bodyParser.json());
app.use(cors());
//JSON-data
const jsonData = {
  title: "My Docker Project",
  description: "This is my Docker Project frontpage.",
  tasks: [
      "Set up Docker environment",
      "Create Dockerfile",
      "Build Docker image",
      "Run Docker container"
  ]
};
// // Route, which responses json-data
// app.get('/json', (req, res) => {
//   res.json(jsonData);
// });

// Route to catch JSON-data
app.get('/api/user', (req, res) => {
  fs.readFile('testuser.json', 'utf8', (err, data) => {
    if (err) {
      res.status(500).send('Error reading data');
      return;
    }
    res.json(JSON.parse(data));
  });
});


app.use(bodyParser.json());

app.post('/api/data', (req, res) => {
  const newData = req.body;
  res.json({
    message: "Data received!",
    data: newData
  });
});

// Serve static files from React build-folder
app.use(express.static(path.join(__dirname, 'mydocker_ts/public')));

// All routes goes to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'mydocker_ts/public', 'index.html'));
});

