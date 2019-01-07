'use strict';

const chai = require('chai');

const chaiHttp = require('chai-http');

chai.use(chaiHttp);

const expect = chai.expect;

const faker = require('faker');

const mongoose = require('mongoose');

const {app, runServer, closeServer} = require('../server');

const {TEST_DATABASE_URL} = require('../config');

const {Users} = require('../models');

const bcrypt = require('bcryptjs');

const {JWT_SECRET} = require('../config');

const jwt = require('jsonwebtoken');

const createAuthToken = function(user) {
  return jwt.sign({user}, JWT_SECRET, {
    subject: user.username,
    expiresIn: '7d',
    algorithm: 'HS256'
  });
};


function generateUserData() {
	return {
		firstName: faker.name.firstName(),
		lastName: faker.name.lastName(),
		username: faker.internet.userName(),
		password: faker.internet.password()
	}
}


function seedUserData() {
  console.info('seeding user data');
  const seedData = [];

  for (let i=1; i<=10; i++) {
    seedData.push(generateUserData());
  } 
  return Users.insertMany(seedData);
}


function tearDownDb() {
  console.warn('Deleting database');
  return mongoose.connection.dropDatabase();
}


describe('POST requests to /login', function(){
	this.timeout(5000);
	let existingUser;

	before(function(){
		return runServer(TEST_DATABASE_URL);
	});

	beforeEach(function() {
    	return seedUserData() 
			.then(users => {
				existingUser = users[0];
				return existingUser;
			})
			.then(existingUser => {
				return Users.findOneAndUpdate({username: existingUser.username}, 
					{password: bcrypt.hashSync(existingUser.password,10)});
			})
  	});

  	afterEach(function() {
    	return tearDownDb();
  	});

	after(function(){
		return closeServer();
	});

	it('Should login existing users on POST requests', function(){
		return chai.request(app)
			.post('/login')
			.send({username: existingUser.username, password: existingUser.password})
			.then(function(res) {
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body).to.be.a('object');
		        expect(res.body).to.include.keys('name','username','vehicles')
		        expect(res.body.username).to.equal(existingUser.username);
		        expect(res.body.vehicles).to.be.an('array');
		        expect(res.body.vehicles).to.have.lengthOf(existingUser.vehicles.length);
		    })
	});

	it('Should return a token on Post requests', function() {
		let token;
		return chai.request(app)
			.post('/login')
			.send({username: existingUser.username, password: existingUser.password})
			.then(function(res) {
				token = res.body.token;
				return Users.findOne({username: existingUser.username});
			})
			.then(function(user) {
				expect(token).to.equal(createAuthToken(user.serialize()));
			})
	});

	it('Should reject login requests without credentials', function() {
		return chai.request(app)
			.post('/login')
			.send({})
			.then(function(res) {
				expect(res).to.have.status(400);
			})
	});

	it('Should reject login requests with invalid credentials', function() {
		return chai.request(app)
			.post('/login')
			.send({username: "fakeUsername", password: "fakePassword"})
			.then(function(res) {
				expect(res).to.have.status(400);
			})
	});
});