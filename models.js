'use strict';

const mongoose = require('mongoose');

const bcrypt = require('bcryptjs');

const vehiclesSchema = mongoose.Schema({
	name: {type: String, required: true},
	year: {type: Number, required: true},
	make: {type: String, required: true},
	model: {type: String, required: true}, 
	engine: {type: String},
});

const usersSchema = mongoose.Schema({
	firstName: {type: String, required: true},
	lastName: {type: String, required: true},
	username: {type: String, required: true},
	password: {type: String, required: true},
	vehicles: [vehiclesSchema],
});

const maintenanceSchema = mongoose.Schema({
	username: {type: String, required: true},
	vehicleName: {type: String, required: true},
	type: {type: String, required: true},
	mileage: {type: String, required: true},
	date: {type: String, required: true},
	nextScheduled: {type: String},
	notes: {type: String},
});

usersSchema.virtual('fullName').get(function() {
 	return `${this.firstName} ${this.lastName}`
});

usersSchema.methods.serialize = function() {
	return {
		name: this.fullName,
		username: this.username,
		vehicles: this.vehicles
	}
};

usersSchema.methods.validatePassword = function(password) {
  return bcrypt.compareSync(password, this.password);
};

usersSchema.statics.hashPassword = function(password) {
  return bcrypt.hash(password, 10);
};

const Users = mongoose.model('Users', usersSchema);

const Vehicles = mongoose.model('Vehicles', vehiclesSchema);

const Maintenance = mongoose.model('Maintenance', maintenanceSchema)

module.exports = {Users, Vehicles, Maintenance}