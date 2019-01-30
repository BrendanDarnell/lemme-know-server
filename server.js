'use strict';

require('dotenv').config();

const express = require('express');

const app = express();

const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const {PORT, DATABASE_URL, CLIENT_ORIGIN} = require('./config');

const {Users, Vehicles, Maintenance} = require('./models');

const signupRouter = require('./signupRouter');

const loginRouter = require('./loginRouter');

const eventsRouter = require('./eventsRouter');

const {handleMessages} = require('./sendMessages');

app.use(express.json());

// CORS
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', CLIENT_ORIGIN);
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE');

    if (req.method === 'OPTIONS') {
        return res.send(204);
    }
  next();
});

app.use('/signup', signupRouter);

app.use('/login', loginRouter);

app.use('/events', eventsRouter);

app.use('*', function(req, res) {
	res.status(404).json({ message: 'Not Found' });
});

// declare server and messageInterval in global scope so the can be accessed
// in closeServer function
let server;
let messageInterval;				

function runServer(databaseUrl, port = PORT) {
 	return new Promise((resolve, reject) => {
    	mongoose.connect(
      		databaseUrl,
      		err => {
        		if (err) {
          		return reject(err);
        	  }
	        server = app
	       		.listen(port, () => {
	            	console.log(`Your app is listening on port ${port}`);
	            	resolve();
	          	})
	            .on('error', err => {
	            	mongoose.disconnect();
	            	reject(err);
	          	});
            // when server opens, check every minute for expired events and send messages
            server.on('listening', () => {
                console.log('on listening called');
                messageInterval = setInterval(handleMessages , 60*1000);
            }); 
          }
    	);
  	});
}


function closeServer() {
 	return mongoose.disconnect().then(() => {
    	return new Promise((resolve, reject) => {
            clearInterval(messageInterval);
    		console.log('Closing server');
     		server.close(err => {
        		if (err) {
        			return reject(err);
        		}
        		resolve();
      		});
    	});
  	});
}


if (require.main === module) {
	runServer(DATABASE_URL).catch(err => console.error(err));
}

module.exports = { app, runServer, closeServer };
