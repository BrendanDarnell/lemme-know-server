'use strict';

const chai = require('chai');

const chaiHttp = require('chai-http');

chai.use(chaiHttp);

const expect = chai.expect;

const faker = require('faker');

const mongoose = require('mongoose');

const {app, runServer, closeServer} = require('../server');

const {TEST_DATABASE_URL} = require('../config');

const {Users, Vehicles, Maintenance} = require('../models');

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

	let newVehicle;

	let newMaint;

	let newMaintTwo;

	let token;

	before(function(){
		return runServer(TEST_DATABASE_URL);
	});

	beforeEach(function() {
    	return seedUserData() 
			.then(users => {
				existingUser = users[0];
				token = createAuthToken(existingUser.serialize());
				newVehicle = {
					username: existingUser.username,
					name: "Frontier",
					year: 2013,
					make: "Nissan",
					model: "Frontier",
					engine: "4.0L V6",
					token: token
				}
				newMaint = {
					username: existingUser.username,
					vehicleName: "Frontier",
					type: "oil change",
					mileage: "150,000",
					date: "10/17/2018",
					nextScheduled: "160,000 miles",
					notes: "replaced drain plug",
					token: token
				}
				newMaintTwo = {
				username: existingUser.username,
				vehicleName: "Frontier",
				type: "replace brake pads and rotors",
				mileage: "175,000",
				date: "10/19/2018",
				nextScheduled: "180,000 miles",
				notes: "brake fluid was low",
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

	
	describe('/users/vehicles/add', function() {
		
		it('Should add a new vehicle on Post requests', function(){		
			return chai.request(app)
				.post('/users/vehicle/add')
				.send(newVehicle)
				.then(function(res) {
					expect(res).to.have.status(201);
					expect(res).to.be.json;
					expect(res.body).to.be.a('object');
			        expect(res.body).to.include.keys('name','username','vehicles');
			        expect(res.body.username).to.equal(existingUser.username);
			        expect(res.body.vehicles).to.be.an('array');
			        expect(res.body.vehicles).to.have.lengthOf(1);
			        existingUser.vehicles.push(res.body.vehicles[0]);
			    	return Users.findOne({username: existingUser.username})    
			    })
			    .then(function(user) {
			    	expect(user._id).to.not.be.empty;
			    	expect(user.username).to.equal(existingUser.username);
			    	expect(user.firstName).to.equal(existingUser.firstName);
			    	expect(user.lastName).to.equal(existingUser.lastName);
			    	expect(user.password).to.equal(existingUser.password);
			    	expect(user.vehicles).to.have.lengthOf(1);
			    	user.vehicles.forEach(function(vehicle) {
			    		let existingVehicle = existingUser.vehicles.find(function(matchingVehicle) {
			    			return matchingVehicle.name === vehicle.name; 	
			    		});
			    		expect(vehicle.name).to.equal(existingVehicle.name);
			    		expect(vehicle.year).to.equal(existingVehicle.year);
			    		expect(vehicle.make).to.equal(existingVehicle.make);
			    		expect(vehicle.model).to.equal(existingVehicle.model);
			    		expect(vehicle.engine).to.equal(existingVehicle.engine);
			    	});		
			    });
		});	
	});

	
	describe('/users/maintenance', function() {
		
		it('Should return all maintenace logs for specified user and vehicle', function() {
			existingUser.vehicles.push(newVehicle);
			existingUser.save();		
			return Maintenance.insertMany([newMaint, newMaintTwo])
				.then(function(maint) {
					return chai.request(app)
						.post('/users/maintenance')
						.send({username: existingUser.username, vehicleName: "Frontier", token: token});
				})
				.then(function(res) {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.be.an('array');
			        expect(res.body).to.have.lengthOf(2);			        
			        res.body.forEach(function(log) {
			      		expect(log).to.include.keys('username','vehicleName','type','mileage','date',
			        		'notes','nextScheduled');
			        	expect(log.username).to.equal(existingUser.username); 
			        	expect(log.vehicleName).to.equal('Frontier');
			        	expect(log.type).to.not.be.empty;
			        	expect(log.mileage).to.not.be.empty;
			        	expect(log.date).to.not.be.empty;
			        	expect(log.notes).to.not.be.empty;
			        	expect(log.nextScheduled).to.not.be.empty;
			        });		
				});
		}); 
	});


	describe('/users/maintenace/add', function() {

		it('Should add a new maintenance log', function() {
			existingUser.vehicles.push(newVehicle);
			existingUser.save();	
			return chai.request(app)
				.post('/users/maintenance/add')
				.send(newMaint)
				.then(function(res) {
					expect(res).to.have.status(201);
					expect(res).to.be.json;
					expect(res.body).to.be.an('array');
					res.body.forEach(function(log) {
				        expect(log).to.include.keys('username','vehicleName','type','mileage','date',
				        	'notes','nextScheduled','_id');
				        expect(log.username).to.equal(newMaint.username);
				        expect(log.vehicleName).to.equal(newMaint.vehicleName);
				        expect(log.type).to.equal(newMaint.type);
				        expect(log.mileage).to.equal(newMaint.mileage);
				        expect(log.date).to.equal(newMaint.date);
				        expect(log.notes).to.equal(newMaint.notes);				     
				        expect(log.nextScheduled).to.equal(newMaint.nextScheduled);
				        expect(log._id).to.not.be.empty;
				    });	
				    return Maintenance.findOne({_id: res.body[0]._id});
				})
				.then(function(log){
			        expect(log.username).to.equal(newMaint.username);
			        expect(log.vehicleName).to.equal(newMaint.vehicleName);
					expect(log.type).to.equal(newMaint.type);
			        expect(log.mileage).to.equal(newMaint.mileage);
			        expect(log.date).to.equal(newMaint.date);
				    expect(log.notes).to.equal(newMaint.notes);
				    expect(log.nextScheduled).to.equal(newMaint.nextScheduled);
				    expect(log._id).to.not.be.empty;
			   	});    
		});
	});

	describe('/users/maintenance/update', function() {

		it('Should update the selected maintenance log', function() {

			existingUser.vehicles.push(newVehicle);
			existingUser.save();

			return Maintenance.create(newMaint)
				.then(function(log) {
					return chai.request(app)
						.put('/users/maintenance/update')
						.send({ _id: log._id, notes:'did not replace drain plug', nextScheduled: '158,000', token: token})
						.then(function(res) {
							expect(res).to.have.status(200);
							expect(res).to.be.json;
							expect(res.body).to.be.an('array');
							res.body.forEach(function(log) {
						        expect(log).to.include.keys('username','vehicleName','type','mileage','date',
						        	'notes','nextScheduled','_id');
						        expect(log.username).to.equal(newMaint.username);
						        expect(log.vehicleName).to.equal(newMaint.vehicleName);
						        expect(log.type).to.equal(newMaint.type);
						        expect(log.mileage).to.equal(newMaint.mileage);
						        expect(log.date).to.equal(newMaint.date);
						        expect(log.notes).to.equal('did not replace drain plug');
						        expect(log.nextScheduled).to.equal('158,000');
						        expect(log._id).to.not.be.empty;
								    });	
				    		return Maintenance.findOne({_id: res.body[0]._id});
						})
						.then(function(log) {
					        expect(log.username).to.equal(newMaint.username);
					        expect(log.vehicleName).to.equal(newMaint.vehicleName);
							expect(log.type).to.equal(newMaint.type);
					        expect(log.mileage).to.equal(newMaint.mileage);
					        expect(log.date).to.equal(newMaint.date);
						    expect(log.notes).to.equal('did not replace drain plug');
						    expect(log.nextScheduled).to.equal('158,000');
						    expect(log._id).to.not.be.empty;
					   	}); 
				});
		});
	});

	describe('/users/maintenance/delete', function() {

		it('Should delete the selected maintenance log', function() {

			existingUser.vehicles.push(newVehicle);
			existingUser.save();

			return Maintenance.create(newMaint)
				.then(function(log) {
					return chai.request(app)
						.del('/users/maintenance/delete')
						.send({_id: log._id, token: token})
						.then(function(res) {
							expect(res).to.have.status(200);
							return Maintenance.findOne({_id: res._id});	
						})
						.then(function(deletedLog) {
							expect(deletedLog).to.be.null;
						})
				})	
		})
	})
});