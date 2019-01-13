'use strict';

const chai = require('chai');

const chaiHttp = require('chai-http');

chai.use(chaiHttp);

const expect = chai.expect;

const faker = require('faker');

const mongoose = require('mongoose');

const moment = require('moment');

const {app, runServer, closeServer} = require('../server');

const {TEST_DATABASE_URL} = require('../config');

const {Users, Events} = require('../models');

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


describe('/users endpoint', function(){
	this.timeout(5000);
	
	let existingUser;

	let newEvent;

	let newEventTwo;

	let token;

	before(function(){
		return runServer(TEST_DATABASE_URL);
	});

	beforeEach(function() {
    	return seedUserData() 
			.then(users => {
				existingUser = users[0];
				token = createAuthToken(existingUser.serialize());
				newEvent = {
					name: existingUser.fullName,
					username: existingUser.username,
					eventName: 'Backpacking',
					date: '01-18-19',
					returnTime: '7:00',
					amOrPm: 'pm',
					utcDateTime: moment.utc('01-18-19 7:00 pm'),
					contactNumber: '1-308-468-5513',
					description: 'Backpacking for a week at RMNP',
					token: token
				}
				newEventTwo = {
					name: existingUser.fullName,
					username: existingUser.username,
					eventName: 'Running',
					date: '01-27-19',
					returnTime: '2:00',
					amOrPm: 'pm',
					utcDateTime: moment.utc('01-27-19 2:00 pm'),
					contactNumber: '1-308-468-5513',
					description: 'Running to Royal Arch at Chataqua Park',
					token: token
				}
				return Users.findOne({username: existingUser.username});
			});
  	});

  	afterEach(function() {
    	return tearDownDb();
  	});

	after(function(){
		return closeServer();
	});

	
	// describe('/users/vehicles/add', function() {
		
	// 	it('Should add a new vehicle on Post requests', function(){		
	// 		return chai.request(app)
	// 			.post('/users/vehicle/add')
	// 			.send(newVehicle)
	// 			.then(function(res) {
	// 				expect(res).to.have.status(201);
	// 				expect(res).to.be.json;
	// 				expect(res.body).to.be.a('object');
	// 		        expect(res.body).to.include.keys('name','username','vehicles');
	// 		        expect(res.body.username).to.equal(existingUser.username);
	// 		        expect(res.body.vehicles).to.be.an('array');
	// 		        expect(res.body.vehicles).to.have.lengthOf(1);
	// 		        existingUser.vehicles.push(res.body.vehicles[0]);
	// 		    	return Users.findOne({username: existingUser.username})    
	// 		    })
	// 		    .then(function(user) {
	// 		    	expect(user._id).to.not.be.empty;
	// 		    	expect(user.username).to.equal(existingUser.username);
	// 		    	expect(user.firstName).to.equal(existingUser.firstName);
	// 		    	expect(user.lastName).to.equal(existingUser.lastName);
	// 		    	expect(user.password).to.equal(existingUser.password);
	// 		    	expect(user.vehicles).to.have.lengthOf(1);
	// 		    	user.vehicles.forEach(function(vehicle) {
	// 		    		let existingVehicle = existingUser.vehicles.find(function(matchingVehicle) {
	// 		    			return matchingVehicle.name === vehicle.name; 	
	// 		    		});
	// 		    		expect(vehicle.name).to.equal(existingVehicle.name);
	// 		    		expect(vehicle.year).to.equal(existingVehicle.year);
	// 		    		expect(vehicle.make).to.equal(existingVehicle.make);
	// 		    		expect(vehicle.model).to.equal(existingVehicle.model);
	// 		    		expect(vehicle.engine).to.equal(existingVehicle.engine);
	// 		    	});		
	// 		    });
	// 	});	
	// });

	
	describe('/events/:username', function() {
		
		it('Should return all events for specified user on POST requests', function() {		
			return Events.insertMany([newEvent, newEventTwo])
				.then(function(event) {
					return chai.request(app)
						.post(`/events/${existingUser.username}`)
						.send({token: token});
				})
				.then(function(res) {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.be.an('array');
			        expect(res.body).to.have.lengthOf(2);			        
			        res.body.forEach(function(event) {
			      		expect(event).to.include.keys('name','username','eventName','date',
			      			'returnTime', 'amOrPm', 'utcDateTime', 'contactNumber', 'description');
			      		expect(event._id).to.not.be.empty;
			        	expect(event.username).to.equal(existingUser.username); 
			        	expect(event.name).to.equal(existingUser.fullName);
			        	expect(event.eventName).to.not.be.empty;
			        	expect(event.date).to.not.be.empty;
			        	expect(event.returnTime).to.not.be.empty;
			        	expect(event.amOrPm).to.not.be.empty;
			        	expect(event.contactNumber).to.not.be.empty;
			        	expect(event.description).to.not.be.empty;
			        	expect(moment(event.utcDateTime).isValid()).to.be.true;
			        });		
				});
		}); 
	});


	describe('/events', function() {

		it('Should add a new event on POST requests', function() {
			return chai.request(app)
				.post('/events')
				.send(newEvent)
				.then(function(res) {
					expect(res).to.have.status(201);
					expect(res).to.be.json;
					expect(res.body).to.be.an('array');
					res.body.forEach(function(event) {
				        expect(event).to.include.keys('name','username','eventName','date',
			      			'returnTime', 'amOrPm', 'utcDateTime', 'contactNumber', 'description');
				        expect(event._id).to.not.be.empty;
				        expect(event.username).to.equal(existingUser.username); 
			        	expect(event.name).to.equal(existingUser.fullName);
			        	expect(event.eventName).to.not.be.empty;
			        	expect(event.date).to.not.be.empty;
			        	expect(event.returnTime).to.not.be.empty;
			        	expect(event.amOrPm).to.not.be.empty;
			        	expect(event.contactNumber).to.not.be.empty;
			        	expect(event.description).to.not.be.empty;
			        	expect(moment(event.utcDateTime).isValid()).to.be.true;
				    });	
				    return Events.findOne({_id: res.body[0]._id});
				})
				.then(function(event){
					expect(event.name).to.equal(newEvent.name);
			        expect(event.username).to.equal(newEvent.username);
			        expect(event.eventName).to.equal(newEvent.eventName);
					expect(event.date).to.equal(newEvent.date);
			        expect(event.returnTime).to.equal(newEvent.returnTime);
			        expect(event.amOrPm).to.equal(newEvent.amOrPm);
				    expect(event.contactNumber).to.equal(newEvent.contactNumber);
				    expect(event.description).to.equal(newEvent.description);
				    expect(event._id).to.not.be.empty;
			   	});    
		});
	});

	// describe('/users/maintenance/update', function() {

	// 	it('Should update the selected maintenance log', function() {

	// 		existingUser.vehicles.push(newVehicle);
	// 		existingUser.save();

	// 		return Maintenance.create(newMaint)
	// 			.then(function(log) {
	// 				return chai.request(app)
	// 					.put('/users/maintenance/update')
	// 					.send({ _id: log._id, notes:'did not replace drain plug', nextScheduled: '158,000', token: token})
	// 					.then(function(res) {
	// 						expect(res).to.have.status(200);
	// 						expect(res).to.be.json;
	// 						expect(res.body).to.be.an('array');
	// 						res.body.forEach(function(log) {
	// 					        expect(log).to.include.keys('username','vehicleName','type','mileage','date',
	// 					        	'notes','nextScheduled','_id');
	// 					        expect(log.username).to.equal(newMaint.username);
	// 					        expect(log.vehicleName).to.equal(newMaint.vehicleName);
	// 					        expect(log.type).to.equal(newMaint.type);
	// 					        expect(log.mileage).to.equal(newMaint.mileage);
	// 					        expect(log.date).to.equal(newMaint.date);
	// 					        expect(log.notes).to.equal('did not replace drain plug');
	// 					        expect(log.nextScheduled).to.equal('158,000');
	// 					        expect(log._id).to.not.be.empty;
	// 							    });	
	// 			    		return Maintenance.findOne({_id: res.body[0]._id});
	// 					})
	// 					.then(function(log) {
	// 				        expect(log.username).to.equal(newMaint.username);
	// 				        expect(log.vehicleName).to.equal(newMaint.vehicleName);
	// 						expect(log.type).to.equal(newMaint.type);
	// 				        expect(log.mileage).to.equal(newMaint.mileage);
	// 				        expect(log.date).to.equal(newMaint.date);
	// 					    expect(log.notes).to.equal('did not replace drain plug');
	// 					    expect(log.nextScheduled).to.equal('158,000');
	// 					    expect(log._id).to.not.be.empty;
	// 				   	}); 
	// 			});
	// 	});
	// });

	describe('/events/:id', function() {

		it('Should delete the selected event on DELETE requests', function() {
			return Events.create(newEvent)
				.then(function(event) {
					return chai.request(app)
						.del(`/events/${event._id}`)
						.send({token: token})
						.then(function(res) {
							expect(res).to.have.status(200);
							return Events.findOne({_id: res._id});	
						})
						.then(function(deletedEvent) {
							expect(deletedEvent).to.be.null;
						})
				});	
		});
	});
});