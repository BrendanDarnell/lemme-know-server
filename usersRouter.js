const express = require('express');

const router = express.Router();

const {Users, Vehicles, Maintenance} = require('./models');

const passport = require('passport');

const {jwtStrategy} = require('./jwtStrategy');

passport.use(jwtStrategy);

router.use(passport.authenticate('jwt', { session: false }));


// router.post('/vehicle/add', (req,res) => {
// 	const requiredFields = ['username', 'make', 'model', 'year', 'name'];
// 	requiredFields.forEach((field) => {
// 		if (!(req.body[field])){
// 			const message = `The vehicle ${field} must be provided to add vehicle`;
// 			console.error(message);
// 			return res.status(400).json({message});
// 		}	
// 	});

// 	if (!(typeof req.body.year === 'number' || req.body.year.toString().length === 4)) {
// 		const message = `Year must be a 4-digit number`;
// 		console.error(message);
// 		return res.status(400).json({message});
// 	}

// 	let user;

// 	Users.findOne({username: req.body.username})
// 	.then(_user => {
// 		user = _user;
// 		let vehicle;
// 		if (user.vehicles) {
// 			vehicle = user.vehicles.find((vehicle) => {
// 				return vehicle.name === req.body.name;
// 			})
// 		}
// 		return vehicle;
// 	})
// 	.then(vehicle => {
// 		if (vehicle) {
// 			return res.status(400).json({message: 'vehicle already exists'});
// 		}
// 		else {
// 			user.vehicles.push(req.body);
// 			user.save();
// 			return res.status(201).json(user.serialize());
// 		}
// 	})
// 	.catch(err=> {
//     	console.error(err);
//     	res.status(500).json({message: "Internal server error"});
//     });
// });


router.get('/events/:username', (req,res) => {
	
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
    	res.status(500).json({message: "Internal server error"});
    });
});


router.post('/events', (req,res) => {
	const requiredFields = ['username','eventName', 'returnDateAndTime', 'contactNumber', 'description'];
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


// router.put('/maintenance/update', (req,res) => {
// 	if(!req.body._id) {
// 		return res.status(400).json({message: 'An id number is required to update maintenance log'})
// 	}

// 	toUpdate = {};
// 	updateableFields = ['type','mileage','date','nextScheduled','notes','links'];

// 	updateableFields.forEach((field) => {
// 		if(field in req.body) {
// 			toUpdate[field] = req.body[field];
// 		}
// 	});

// 	Maintenance.findByIdAndUpdate(req.body._id,toUpdate)
// 	.then((log) => {
// 		if(!log) {
// 			return res.status(400).json({message: 'Could not update maintenance log'});
// 		}
// 		return Maintenance.find({username: log.username, vehicleName: log.vehicleName})
// 	})
// 	.then((logs) => {
// 		return res.status(200).json(logs);
// 	})
// 	.catch(err=> {
//     	console.error(err);
//     	res.status(500).json({message: "Internal server error"});
//     });	
// });


router.delete('/events/:id', (req,res) => {
	if(!req.params.id) {
		return res.status(400).json({message: 'An id number is required to delete an event'})
	}

	Maintenance.findByIdAndRemove(req.params.id)
	.then(deletedLog => {
		if(deletedLog) {
			return res.status(200).json(deletedLog);
		}
	})
	.catch(err=> {
    	console.error(err);
    	res.status(500).json({message: 'Internal server error'});
    });	
	
});
	
module.exports = router;
