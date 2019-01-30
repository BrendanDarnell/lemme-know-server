const express = require('express');

const router = express.Router();

const {Users} = require('./models');

const {JWT_SECRET} = require('./config');

const jwt = require('jsonwebtoken');

const createAuthToken = function(user) {
  return jwt.sign({user}, JWT_SECRET, {
    subject: user.username,
    expiresIn: '7d',
    algorithm: 'HS256'
  });
};


router.post('/', (req, res) => {
	const requiredFields = ['firstName', 'lastName', 'username', 'password'];
	requiredFields.forEach(field => {
		if (!(req.body[field])){
			const message = `Missing ${field}`;
			console.error(message);
			return res.status(400).json({message});
		}	
	});

	const sizedFields = {
		username: {min: 3, max: 40},
		password: {min: 8, max: 40},
	};

	try {
		const tooSmall = Object.keys(sizedFields).forEach(field => {
			if (req.body[field].length < sizedFields[field].min) {
				return res.status(400).json({message: `${field} needs to be at least ${sizedFields[field].min} characters long`});
			}
		});

		const tooLarge = Object.keys(sizedFields).forEach(field => {
			if (req.body[field].length > sizedFields[field].max) {
				return res.status(400).json({message: `${field} needs to be less than ${sizedFields[field].max} characters long`});
			}
		});
	}
	catch (err) {
		console.log(err);
		res.status(500).json({message: 'Internal server error...'})
	}


	Users.findOne({username: req.body.username})
	.then(user => {
		if (user) { 
			if (user.username === req.body.username) {
				console.log('user exists');
				res.status(400).json({message: 'username already exists'});
				return Promise.reject('User exists');		
			}
		}
	})
	.then(() => {
		return Users.hashPassword(req.body.password);
	})
	.then((hash) => {
		console.log('creating new user')
		return Users.create({
	 		firstName: req.body.firstName,
	 		lastName: req.body.lastName,
	 		username: req.body.username,
	 		password: hash,
 		})
	})
	.then(user => {
		let userAndToken = user.serialize();
		userAndToken.token = createAuthToken(user.serialize());
		res.status(201).json(userAndToken)
	})
	.catch(err=> {
    	console.error(err);
    	res.status(500).json({message: "Internal server error"})
 	});

});

module.exports = router;