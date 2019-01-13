"use strict";
exports.DATABASE_URL =
  process.env.DATABASE_URL || "mongodb://localhost/lemme-know";
exports.TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL || "mongodb://localhost/test-lemme-know";
exports.PORT = process.env.PORT || 8080;
exports.JWT_SECRET = process.env.JWT_SECRET;
exports.TWILLIO_ID =  process.env.TWILLIO_ID;
exports.TWILLIO_TOKEN = process.env.TWILLIO_TOKEN;