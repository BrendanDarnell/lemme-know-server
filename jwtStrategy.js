const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');

const {Users} = require('./models');

const {JWT_SECRET} = require('./config');

const jwtStrategy = new JwtStrategy(
	{
	secretOrKey: JWT_SECRET,
    jwtFromRequest: ExtractJwt.fromBodyField('token'),
    algorithms: ['HS256']
  	},
  
	(payload, done) => {
	  	Users.findOne({username: payload.user.username}, (err, user) => {
	        if (err) {
	            return done(err, false);
	        }
	        if (user) {
	            return done(null, user);
	        } else {
	            return done(null, false);
	        }
	    });
  	}
);

module.exports = {jwtStrategy};