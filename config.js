"use strict";
exports.DATABASE_URL =
  process.env.DATABASE_URL || "mongodb://localhost/lemme-know";
exports.TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL || "mongodb://localhost/test-lemme-know";
exports.CLIENT_ORIGIN = 
	process.env.CLIENT_ORIGIN || 'http://localhost:3000';
exports.PORT = process.env.PORT || 8080;
exports.JWT_SECRET = process.env.JWT_SECRET;
exports.TWILIO_ID =  process.env.TWILIO_ID;
exports.TWILIO_TOKEN = process.env.TWILIO_TOKEN;