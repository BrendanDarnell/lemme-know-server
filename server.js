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

const {sendMessage} = require('./sendMessages')

app.use(express.static('public'));

app.use(express.json());

// CORS
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
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

let server;
				

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
            // server.on('listening', () => {
            //     console.log('sending message');
            //     sendMessage({
            //       personName: 'Brendan Darnell',
            //       eventName: 'Skiing',
            //       description: 'Went backcountry skiing near Bear Lake RMNP'
            //       });
            //   });
      		  
          }
    	);
  	});
}


function closeServer() {
 	return mongoose.disconnect().then(() => {
    	return new Promise((resolve, reject) => {
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
