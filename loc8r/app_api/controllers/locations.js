var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
var Loc = mongoose.model('Location');
var _ = require('underscore');

module.exports.locationsListByDistance = function (req, res) {
	var lng = parseFloat(req.query.lng);
	var lat = parseFloat(req.query.lat);
	var maxDistance = req.query.maxDistance && parseFloat(req.query.maxDistance) || 20;
	var point = {
		type: "Point",
		coordinates: [lng, lat]
	};
	var geoOptions = {
		spherical: true,
		maxDistance: maxDistance * 1000, // meters
		num: 10
	};

	// https://docs.mongodb.org/manual/reference/command/geoNear/#dsphere-index

	// Note, callback has two arguments
	// Loc.geoNear(point, options, function (err, results, stats) {...});
	Loc.geoNear(point, geoOptions).then(function (results) {
		var locations = [];
		results.forEach(function(doc) {
			locations.push({
				distance: doc.dis / 1000,
				name: doc.obj.name,
				address: doc.obj.address,
				rating: doc.obj.rating,
				facilities: doc.obj.facilities,
				_id: doc.obj._id
			});
		});
		sendJsonResponse(res, 200, locations);
	}).catch(function (err) {
		console.error(err);
	});
};

module.exports.locationsCreate = function(req, res) {
	var newLocation = buildLocationFromRequest(req);
	Loc.create(newLocation).then(function (location) {
		sendJsonResponse(res, 201, location);
	}).catch(function (err) {
		sendJsonResponse(res, 400, err);
	});
};

module.exports.locationsReadOne = function (req, res) {
	if (req.params && req.params.locationid) {
		Loc.findById(req.params.locationid).exec().then(function (location) {
			if (!location) {
				return sendJsonResponse(res, 404, {"message": "locationid not found"});
			}
			return sendJsonResponse(res, 200, location);
		}).catch(function (err) {
			return sendJsonResponse(res, 404, {"message": "location not found"});
		});
	} else {
		sendJsonResponse(res, 404, {"message": "No locationid in request"});
	}
};

module.exports.locationsUpdateOne = function (req, res) {
	if (!req.params.locationid) {
		return sendJsonResponse(res, 404, {"message": "Not found, locationid is required"});
	}
	Loc.findById(req.params.locationid).select("-rating -reviews").exec().then(function (location) {
		if (!location) {
			return sendJsonResponse(res, 404, {"message": "locationid not found"});
		}
		var updatedLocation = _.omit(buildUpdatedLocationFromRequest(req), function (val) {
			return typeof val === 'undefined';
		});
		_.each(updatedLocation, function (value, key) {
			location[key] = value;
		});
		location.save().then(function (location) {
			return sendJsonResponse(res, 200, location);
		}).catch(function (err) {
			return sendJsonResponse(res, 404, err);
		});
	}).catch(function (err) {
		return sendJsonResponse(res, 400, err);
	});
};

module.exports.locationsDeleteOne = function(req, res) {
	var locationid = req.params.locationid;
	if (locationid) {
		Loc.findByIdAndRemove(locationid).exec().then(function () {
			return sendJsonResponse(res, 204, null);
		}).catch(function (err) {
			return sendJsonResponse(res, 404, err);
		});
	} else {
		return sendJsonResponse(res, 404, { "message": "No locationid" });
	}
};

//---------------------------------------------------------------------------//

var sendJsonResponse = function(res, status, content) {
	res.status(status);
	res.json(content);
};

var buildLocationFromRequest = function (req) {
	return {
		name: req.body.name,
		address: req.body.address,
		facilities: req.body.facilities.split(","),
		coords: [parseFloat(req.body.lng), parseFloat(req.body.lat)],
		openingTimes: [{
			days: req.body.days1,
			opening: req.body.opening1,
			closing: req.body.closing1,
			closed: req.body.closed1 || false,
		}, {
			days: req.body.days2,
			opening: req.body.opening2,
			closing: req.body.closing2,
			closed: req.body.closed2 || false,
		}]
	};
};

// TO-DO: better update of hours
var buildUpdatedLocationFromRequest = function (req) {
	return {
		name: req.body.name && req.body.name,
		address: req.body.address && req.body.address,
		facilities: req.body.facilities && req.body.facilities.split(","),
		coords: req.body.lng && req.body.lat && [parseFloat(req.body.lng), parseFloat(req.body.lat)]
	};
}
