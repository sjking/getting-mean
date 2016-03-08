require('../app_api/models/db');

var Promise = require('bluebird'),
	mongoose = require('mongoose'),
	Loc = mongoose.model('Location');

mongoose.connection.on('connected', populateFakeData);

var startCups = {
	name: 'Starcups',
	address: '125 High Street, Reading, RG6 1PS',
	facilities: ['Hot drinks', 'Food', 'Premium wifi'],
	coords: [-122.918847, 49.279696],
	openingTimes: [
		{ days: 'Monday - Friday', opening: '7:00am', closing: '7:00pm', closed: false },
		{ days: 'Saturday', opening: '8:00am', closing: '5:00pm', closed: false },
		{ days: 'Sunday', closed: true }
	],
	rating: 3,
	reviews: [{
		author: 'Ricardo Potemkin',
		rating: 2,
		timestamp: '16 January 2016',
		reviewText: 'Barely acceptable, there was a cockroach in my donutz!'
	}, {
		author: 'Marky Vestron',
		rating: 3,
		timestamp: '16 June 2013',
		reviewText: 'It was OK. The coffee tasted like burnt metal, but the wifi was fast.'
	}]
};

var cafeHero = {
	name: 'Cafe Hero',
	address: '125 High Street, Reading, RG6 1PS',
	facilities: ['Hot drinks', 'Food', 'Premium wifi'],
	coords: [-122.968171, 49.280240],
	openingTimes: [
		{ days: 'Monday - Friday', opening: '8:00am', closing: '11:00pm', closed: false },
		{ days: 'Saturday', opening: '9:00am', closing: '9:00pm', closed: false },
		{ days: 'Sunday', opening: '10:00am', closing: '6:00pm', closed: false }
	],
	rating: 4,
	reviews: [{
		author: 'Izzy Park',
		rating: 5,
		timestamp: '16 July 2013',
		reviewText: 'What a superlative place. I can\'t say enough excellent things about it.'
	}, {
		author: 'Charlie Chaplin',
		rating: 4,
		timestamp: '16 June 2013',
		reviewText: 'It was fine. Coffee wasn\'t great, but the wifi was snappy.'
	}]
};


var locations = [startCups, cafeHero];

var createLocation = function(location) {
	return new Promise(function (resolve, reject) {
		Loc.create(location, function (err, location) {
			if (err) {
				reject(err);
			}
			resolve(location);
		});
	});
};

function printLocation(location) {
	console.log(JSON.stringify(location));
}

function populateFakeData() {
	Promise.map(locations, createLocation).then(function (locations) {
		console.log("Created %d locations", locations.length);
		locations.forEach(printLocation);
		process.exit(0);
	}).catch(function (error) {
		console.error("There was an error creating data: ", error);
		process.exit(1);
	});
}


