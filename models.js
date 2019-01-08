'use strict';

const mongoose = require('mongoose');

const bcrypt = require('bcryptjs');


const usersSchema = mongoose.Schema({
	firstName: {type: String, required: true},
	lastName: {type: String, required: true},
	username: {type: String, required: true},
	password: {type: String, required: true},
});

const eventsSchema = mongoose.Schema({
	username: {type: String, required: true},
	eventName: {type: String, required: true},
	returnDateAndTime: {type: String, required: true},
	contactNumber: {type: String, required: true},
	description: {type: String, required: true},
});

usersSchema.virtual('fullName').get(function() {
 	return `${this.firstName} ${this.lastName}`
});

usersSchema.methods.serialize = function() {
	return {
		name: this.fullName,
		username: this.username
	}
};

usersSchema.methods.validatePassword = function(password) {
	return bcrypt.compareSync(password, this.password);
};

usersSchema.statics.hashPassword = function(password) {
	return bcrypt.hash(password, 10);
};

const Users = mongoose.model('Users', usersSchema);

const Events = mongoose.model('Events', eventsSchema);

module.exports = {Users, Events};