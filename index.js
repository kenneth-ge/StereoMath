const express = require('express');
const path = require('path');  // for handling file paths
const ejs = require('ejs');

const app = express();
const port = process.env.PORT || 3000;  // use environment variable for port or default to 3000

const {synthesize} = require('./customtts')

// Define the root directory for your static files (e.g., HTML, CSS, JS)
const staticPath = path.join(__dirname, 'static');

// Serve static files from the 'public' directory
app.use(express.static(staticPath));

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Set the directory containing EJS templates (optional, defaults to 'views')
app.set('views', path.join(__dirname, 'views'));

// Route to handle all other requests (usually serves index.html)
app.get('/', (req, res) => {
  res.render('editor')  // Replace with your main HTML file if different
});

app.get('/gettts', async (req, res) => {
  res.contentType('audio/pcm');
  await synthesize(req.query.text, res)
});

app.get('/testinput', (req, res) => {
  res.render('testinput')  // Replace with your main HTML file if different
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
