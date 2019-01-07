const express = require('express');

const router = express.Router();

const {Users} = require('./models');

const {JWT_SECRET} = require('./config');

const jwt = require('jsonwebtoken')

const createAuthToken = function(user) {
  return jwt.sign({user}, JWT_SECRET, {
    subject: user.username,
    expiresIn: '7d',
    algorithm: 'HS256'
  });
};


router.post('/', (req, res) => {
	const requiredFields = ['username', 'password'];
	requiredFields.forEach(field => {
		if (!(req.body[field])){
			const message = `Missing ${field}`;
			console.error(message);
			return res.status(400).json({message});
		}	
	});

	Users.findOne({username: req.body.username})
	.then(user => {	
		if (!user) { 
			res.status(400).json({message: 'username does not exist'});
			return Promise.reject('username does not exist');		
		}
		else if (!user.validatePassword(req.body.password)) {
			res.status(400).json({message: 'wrong password'});
			return Promise.reject('wrong password');
		}
		else if (user.validatePassword(req.body.password)) {
			console.log(`logging in ${user.serialize()}`)
			let userAndToken = user.serialize();
			userAndToken.token = createAuthToken(user.serialize());
			return res.status(200).json(userAndToken);			
		}
		else {
			res.status(400).json({message: 'could not login'});
			return Promise.reject('could not login');			
		}
	})
	.catch(err=> {
    	console.error(err);
    	res.status(500).json({message: "Internal server error"})
 	});

});


module.exports = router;