const 	{TWILIO_ID, TWILIO_TOKEN} = require('./config');

const client = require('twilio')(TWILIO_ID, TWILIO_TOKEN);

const moment = require('moment');

const {Events} = require('./models');

function findExpiredEvents() {
	return Events.find()
		.then(events => {
			console.log(events);
			let expiredEvents = [];
			events.forEach(event => {
				if(moment(event.utcDateTime).isBefore(moment())) {
					expiredEvents.push(event);
				}
			});
			return expiredEvents;
		})
		.catch(err => {
			let message = 'Error finding expired events.';
			console.error(message);
			return Promise.reject(message);
		});
}

function sendMessage(event) {
	return client.messages.create({
		body: `This is a message from the Lemme Know app.  ${event.name} did not check-in from the\
		following event: ${event.eventName}- ${event.description}.  Could you please make sure they're okay?`,
		from: '+17754132990',
		to: `+${event.contactNumber.replace(/-/g,"")}`
		})
		.then(message => console.log(message))
		.catch(err => {
		 	console.error(err);
			return Promise.reject(err);
		});
}

function removeEvent(event) {
	return Events.findByIdAndRemove(event._id)
		.then(event => console.log(`Event ${event._id} has been removed from database.`))
		.catch(err => {
			let message = `Error removing ${event._id} from database.`;
			console.error(message);
			return Promise.reject(message);
		})
}

function handleMessages() {
	findExpiredEvents()
	.then(expiredEvents => {
		expiredEvents.forEach(event => {
			sendMessage(event)
			.then(() => {
				return removeEvent(event);
			})
			.catch(err => {
				console.error(`Failed to handle messaging for ${event._id} due to error.`)
			})
		})
	})
	.catch(err => {
		console.log(err);
	});
}

module.exports = {handleMessages};