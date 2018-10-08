// server.js
// where your node app starts

// init project
var express = require('express');
var app = express();

// init firebase
var firebase = require('firebase');
var config = {
   apiKey: process.env.apiKey,
   authDomain: process.env.authDomain,
   databaseURL: process.env.databaseURL,
   projectId: process.env.projectId,
   storageBucket: process.env.storageBucket,
   messagingSenderId: process.env.messagingSenderId
};
// init other
const axios = require('axios');
const winston = require('winston') 
//const { format, createLogger, transports } = require('winston');
const fs = require('fs');
const timestamp = () => (new Date()).toLocaleTimeString();
const filename = __dirname +'/public/winston.log';
// INFO **** for some reason the winston.log file is not appearing in navigator
//           look via Console, cd public, tail -f winston.log
let logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss.SSS'
    }),
    winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)

  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename })
  ]
});


logger.info('STARTING APP');

// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

  

async function writeToFirebase(segment, req, res, next){
  
  var qs = JSON.stringify(req.query)
  logger.info(["writing to firebase",segment, qs]);

  var email = req.query["firebase-user-email"];
  var pwd = req.query["firebase-user-pwd"];

  delete req.query["firebase-user-email"];
  delete req.query["firebase-user-pwd"];

  req.query["firebase-createdBy"] = process.env.PROJECT_DOMAIN;
  req.query["firebase-createdAt"] = new Date().toLocaleString("de-DE");

  res.header( 'Content-Type', 'application/json; charset=utf-8' );
  
  firebase.auth().signInWithEmailAndPassword(email, pwd)
    .then((user) => {
       logger.info("sending data");
       try{ 
         firebase.database().ref().child(segment).push(req.query);
         logger.info("sending data done");
       }catch(error){
         logger.error(error);
       }
       res.send(req.query);
      return;
       
  }, (error) => logger.error(error))
    .then(() => {
     // INFO ***********
     // for some reason, the "child(segment).push(req.query)" above, does not work, if the signOut is to early
     // although one would expect it to work correctly with Promise-Chaining https://javascript.info/promise-chaining
     // therefore I introduced a waiting time before the sign-out
       setTimeout(() => { 
        logger.info("signing out");
        return firebase.auth().signOut();
       },2000);
  }, (error) => logger.error(error))
    .then(() => {
        logger.info("Sign-out successful.");
      }, function(error) {
        logger.error("Sign-out failed.", error);
  }, (error) => logger.error(error)).catch(error => {
        logger.error(error);
  });
  
}

function wakeMeUp(req, res, next) {
    logger.info('wakeMeUp called!');
    setTimeout(() => {
      logger.info("calling new wakeMeUp " );
      axios.get('https://'+process.env.PROJECT_DOMAIN+'.glitch.me/wakeMeUp')
        .then(response => {
          
        logger.info("wakeMeUp Call done and ok: " + response.data);
        })
        .catch(error => {
          logger.error(error);
        });
    }, 240000);
    if (res)
      res.send("wakeMeUpCall received");
}

function initExpress(){
  // http://expressjs.com/en/starter/basic-routing.html
  app.get('/', function(request, response) {
    response.sendFile(__dirname + '/views/index.html');
  });
  
  // INFO: GET Requests used, because is easier from zoho
  app.get("/accounts", (req, res, next) => {
    logger.info("/accounts called");  
    writeToFirebase("accountsss",req,res,next)
  
   });
  
  // INFO: GET Requests used, because is easier from zoho
  app.get("/leads", (req, res, next) => {
    logger.info("/leads called");  
    writeToFirebase("leadsss",req,res, next)
   });
  
  /**
  * keep myself awake, as glitches fall asleep after 5 minutes
  */
  app.get("/wakeMeUp", wakeMeUp);

  
  var listener = app.listen(process.env.PORT, function() {
    logger.info('Your app is listening on port ' + listener.address().port);
  });
  
  // start wakeUp - cycle
  wakeMeUp();
}

firebase.initializeApp(config);
initExpress()