const fs = require('fs');
const path = require('path');
const https = require('https');
const helmet = require('helmet');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config(); 
const cookieSession = require('cookie-session');

const express = require('express');

const PORT = 3000;

const config = {
    CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    COOKIE_KEY_1: process.env.COOKIE_KEY_1,
    COOKIE_KEY_2: process.env.COOKIE_KEY_2
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

//Saving the session to the cookie:
passport.serializeUser((user, done) => {
    //This sets the value of the cookie:
    console.log("Serialized")
    done(null, user.id);
})

//Reading session from the cookie:
passport.deserializeUser((id, done) => {
    //The obj will populate the req.user property in Express:
    console.log('Deserialized', id);
    done(null, id);
})

const app = express();

app.use(helmet());

//This allows for storing session data in a cookie
app.use(cookieSession({
    name: 'session',
    maxAge: 24 * 60 * 60 * 1000,
    keys: [ config.COOKIE_KEY_1, config.COOKIE_KEY_2 ]
}));

app.use(passport.initialize());

app.use(passport.session());
app.use((req, res, next) => {
    console.log('Request', req.session);
    next();
}); 

function checkLoggedIn(req, res, next) {
    console.log('User', req.user)
    const isLoggedIn = req.isAuthenticated() && req.user 
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
        session: true,
    }), 
    (req, res) => {
        console.log('Google called us back');
    }
);

//How a user logs out
app.get('/auth/logout', (req, res) => {
    //This passport logout function removes the req.user property and clears any logged in sessions
    req.logout();
    return res.redirect('/');
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