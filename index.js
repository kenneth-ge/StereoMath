const express = require('express');
const path = require('path');  // for handling file paths
const ejs = require('ejs');

const server = express();
const port = process.env.PORT || 3000;  // use environment variable for port or default to 3000

const { synthesize, resetPiperTTS } = require('./customtts')

// Define the root directory for your static files (e.g., HTML, CSS, JS)
const staticPath = path.join(__dirname, 'static');

// Serve static files from the 'public' directory
server.use(express.static(staticPath));

// Set EJS as the view engine
server.set('view engine', 'ejs');

// Set the directory containing EJS templates (optional, defaults to 'views')
server.set('views', path.join(__dirname, 'views'));

// Route to handle all other requests (usually serves index.html)
server.get('/', (req, res) => {
  res.render('editor')  // Replace with your main HTML file if different
});

server.get('/gettts', async (req, res) => {
  res.contentType('audio/pcm');
  await synthesize(req.query.text, res)
});

server.get('/testinput', (req, res) => {
  res.render('testinput')  // Replace with your main HTML file if different
});

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

server.get('/reset_tts', (req, res) => {
  resetPiperTTS()
  res.status(200)
})


const { app, BrowserWindow } = require('electron')

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    icon: "icons/icon.png"
  })

  win.loadURL('http://localhost:3000')
}

app.whenReady().then(() => {
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})