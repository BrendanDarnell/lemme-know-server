const express = require('express');

const router = express.Router();

const {Users, Events} = require('./models');

const passport = require('passport');

const {jwtStrategy} = require('./jwtStrategy');

passport.use(jwtStrategy);

router.use(passport.authenticate('jwt', { session: false }));

router.post('/:username', (req,res) => {
	
	if (!(req.params.username)){
		const message = 'Missing username in request parameters';
		console.error(message);
		return res.status(400).json({message});
	}	

	Users.findOne({username: req.params.username})
	.then(user => {
	    if (user) {
	   		return Events.find({username: user.username});
	    }
	   	else {
	    	res.status(400).json({message: `No user found with username: ${req.params.username}`});
	    }
	})
	.then((events) => res.status(200).json(events))
	.catch(err=> {
    	console.error(err);
    	res.status(500).json({message: 'Sorry, there was an error loading your events'});
    });
});


router.post('/', (req,res) => {
	const requiredFields = ['name','username','eventName', 'date', 'returnTime', 
		'amOrPm', 'utcDateTime', 'contactNumber', 'description'];
	requiredFields.forEach((field) => {
		if (!(req.body[field])){
			console.log(`missing field = ${field}`);
			const message = `A ${field} is required to add events`;
			console.error(message);
			return res.status(400).json({message});
		}	
	});

    Users.findOne({username: req.body.username})
    .then(user => {
    	if (user) {
    		return Events.create(req.body);
    	}
    	else {
    		res.status(400).json({message: `No user found with username: ${req.params.username}`});
    	}
    })
    .then(() => {
    	return Events.find({username: req.body.username});
    })
    .then((events) => res.status(201).json(events))
    .catch(err=> {
    	console.error(err);
    	res.status(500).json({message: "Internal server error"});
    });
});


router.delete('/:id', (req,res) => {
	if(!req.params.id) {
		return res.status(400).json({message: 'An id number is required to delete an event'})
	}

	Events.findByIdAndRemove(req.params.id)
	.then(deletedEvent => {
		if(deletedEvent) {
			return Events.find({username: deletedEvent.username});
		}
		else{
			res.status(400).json({message: 'Could not delete the requested event'})
		}
	})
	.then(events => {
		return res.status(200).json(events);
	})
	.catch(err=> {
    	console.error(err);
    	res.status(500).json({message: 'Internal server error'});
    });		
});
	
module.exports = router;
