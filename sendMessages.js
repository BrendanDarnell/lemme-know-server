const twilioId = 'ACd785937aef1f413b0997948f19f110e3';
const twilioToken = 'da448dbeaac1e835d7aaa7a05de5eae5';
// const twilioNumber = 1
const client = require('twilio')(twilioId, twilioToken);

const moment = rquire('moment');

const {Events} = require('./models');

function findExpiredEvents() {
	Events.find()
	.then(events => {
		let expiredEvents = [];
		events.forEach(event => {
			if(event.returnDateAndTime.isBefore(moment())) {
				expiredEvents.push(event);
			}
		});
		return expiredEvents;
	})
	.catch(err => {
		let message = 'Error finding expired events.';
		console.error(message);
		return Promise.reject(message);
	}
}

function sendMessage(event) {
	client.messages.create({
		body: `This is a message from the Lemme Know app.  ${event.personName} did not check-in from the\
		the following event: ${event.eventName}- ${event.description}.  Could you please make sure they're okay?`,
		from: '+17754132990',
		to: '+13038106281'
	})
	.then(message => console.log(message))
	.catch(err => {
	 	console.error(err);
		return Promise.reject(err);
	}
}

function removeEvent(event) {
	Events.findByIdAndRemove(event._id)
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
				console.error(`Failed to handle messaging for ${event._id} due to error.`,  )

			})
		})
	}
}

module.exports = {sendMessage};