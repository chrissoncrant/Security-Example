const fs = require('fs');
const path = require('path');
const https = require('https');
const helmet = require('helmet');

const express = require('express');

const PORT = 3000;

const app = express();

app.use(helmet());

function checkLoggedIn(req, res, next) {
    const isLoggedIn = true //TODO
    if (!isLoggedIn) {
        return res.status(401).json({
            error: "You must log in!"
        })
    };
    next();
}

//This is where a user is taken when they click login:
app.get('/auth/google', (req, res) => {

});

//This is where the OAuth google callback is returned to, server side, to receive the Authorization Code from Google. The response is the Authorization Code plus the client secret which was established when the server was registered with the Google Authorization Server in Video 217:
app.get('/auth/google/callback', (req, res) => {

});

//How a user logs out
app.get('/auth/logout', (req, res) => {

});

app.get('/secret', checkLoggedIn, (req, res) => {
    return res.send('Your personal secret is 42!');
})

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

https.createServer({
    //ssl certificate goes here:
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
}, app).listen(PORT, () => {
    console.log(`Server listening on port ${PORT}...`)
});