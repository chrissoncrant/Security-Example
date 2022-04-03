const fs = require('fs');
const path = require('path');
const https = require('https');
const helmet = require('helmet');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config(); 

const express = require('express');

const PORT = 3000;

const config = {
    CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET
}

const AUTH_OPTIONS = {
    clientID: config.CLIENT_ID,
    clientSecret: config.CLIENT_SECRET,
    callbackURL: '/auth/google/callback'
};

function verifyCallback(accessToken, refreshToken, profile, done) {
    console.log('Google Profile', profile);
    done(null, profile);
}

passport.use(new GoogleStrategy(AUTH_OPTIONS, verifyCallback));

const app = express();

app.use(helmet());
app.use(passport.initialize());

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
app.get('/auth/google',
    passport.authenticate('google', {
        //This tells what information the resource database needs back from Google to fill out the user profile:
        scope: ['email']
    })
);

//This is where the OAuth google callback is returned to, server side, to receive the Authorization Code from Google. The response is the Authorization Code plus the client secret, which was established when the server was registered with the Google Authorization Server in Video 217:
app.get('/auth/google/callback', 
    passport.authenticate('google', {
        failureRedirect: '/failure',
        successRedirect: '/',
        session: false,
    }), 
    (req, res) => {
        console.log('Google called us back');
    }
);

//How a user logs out
app.get('/auth/logout', (req, res) => {

});

app.get('/secret', checkLoggedIn, (req, res) => {
    return res.send('Your personal secret is 42!');
})

app.get('/failure', (req, res) => {
    res.send("Failed to log in.")
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