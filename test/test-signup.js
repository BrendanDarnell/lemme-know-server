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


describe('POST requests to /signup', function(){
	this.timeout(5000);

	before(function(){
		return runServer(TEST_DATABASE_URL);
	});

	beforeEach(function() {
    	return seedUserData();
  	});

  	afterEach(function() {
    	return tearDownDb();
  	});

	after(function(){
		return closeServer();
	});

	
	it('Should create a new user on POST requests', function(){
		const newUser = generateUserData();

		return chai.request(app)
			.post('/signup')
			.send(newUser)
			.then(function(res) {
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body).to.be.a('object');
		        expect(res.body).to.include.keys('name','username')
		        expect(res.body.username).to.equal(newUser.username);
		        return Users.findOne({username: newUser.username})
			})
			.then(function(user) {
				expect(user._id).to.not.be.empty;
				expect(user.username).to.equal(newUser.username);
				expect(user.firstName).to.equal(newUser.firstName);
				expect(user.lastName).to.equal(newUser.lastName);
				expect(user.validatePassword(newUser.password)).to.be.true;
				expect(user._id).to.not.be.empty;
			})
	});

	it('Should return a token on Post requests', function() {
		const newUser = generateUserData();
		let token;
		return chai.request(app)
			.post('/signup')
			.send(newUser)
			.then(function(res) {
				token = res.body.token;
				return Users.findOne({username: newUser.username});
			})
			.then(function(user) {
				expect(token).to.equal(createAuthToken(user.serialize()));
			})
	});
});