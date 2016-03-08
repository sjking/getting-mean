var mongoose = require( 'mongoose');
mongoose.Promise = require('bluebird');
var Loc = mongoose.model('Location');
var _ = require('underscore');

module.exports.reviewsCreate = function(req, res) {
	var locationid = req.params.locationid;
	if (locationid) {
		Loc.findById(locationid).select('reviews').exec().then(function (location) {
			doAddReview(req, res, location);
		}).catch(function (err) {
			sendJsonResponse(res, 400, err);
		});
	} else {
		sendJsonResponse(res, 404, {"message": "Not found, locationid required"});
	}
};

module.exports.reviewsReadOne = function (req, res) {
	if (req.params && req.params.locationid && req.params.reviewid) {
		Loc.findById(req.params.locationid).select('name reviews').exec().then(function (location) {
			var response, review;
			if (!location) {
				return sendJsonResponse(res, 404, {"message": "locationid not found"});
			}
			if (location.reviews && location.reviews.length > 0) {
				review = location.reviews.id(req.params.reviewid);
				if (!review) {
					return sendJsonResponse(res, 404, {"message": "reviewid not found"});
				}
				response = {
					location: {
						name: location.name,
						id: req.params.locationid
					},
					review: review
				};
				return sendJsonResponse(res, 200, response);
			}
			return sendJsonResponse(res, 404, {"message": "No reviews found"});
		}).catch(function (err) {
			sendJsonResponse(res, 400, err);
		});
	}
};

module.exports.reviewsUpdateOne = function (req, res) {
	if (!req.params.locationid || !req.params.reviewid) {
		return sendJsonResponse(res, 404, { "message": "Not found, locationid and reviewid are both required" });
	}
	Loc.findById(req.params.locationid).select('reviews').exec().then(function (location) {
		if (!location) {
			return sendJsonResponse(res, 404, { "message": "locationid not found" });
		}
		if (location.reviews && location.reviews.length > 0) {
			var thisReview = location.reviews.id(req.params.reviewid); // find sub-document
			if (!thisReview) {
				return sendJsonResponse(res, 404, { "message": "reviewid not found" });
			}
			thisReview.author = req.body.author;
			thisReview.rating = req.body.rating;
			thisReview.reviewText = req.body.reviewText;
			location.save().then(function (location) {
				updateAverageRating(location._id);
				return sendJsonResponse(res, 200, thisReview);
			}).catch(function (err) {
				return sendJsonResponse(res, 404, err);
			});
		} else {
			return sendJsonResponse(res, 404, { "message": "No review to update" });
		}
	}).catch(function (err) {
		return sendJsonResponse(res, 400, err);
	});
};

module.exports.reviewsDeleteOne = function (req, res) {
	if (!req.params.locationid || !req.params.reviewid) {
		sendJsonResponse(res, 404, {"message": "Not found, locationid and reviewid are both required"});
		return;
	}
	Loc.findById(req.params.locationid).select('reviews').exec().then(function (location) {
		if (!location) {
			return sendJsonResponse(res, 404, {"message": "locationid not found"});
		}
		if (location.reviews && location.reviews.length > 0) {
			if (!location.reviews.id(req.params.reviewid)) {
				return sendJsonResponse(res, 404, {"message": "reviewid not found"});
			}
			location.reviews.id(req.params.reviewid).remove();
			location.save().then(function () {
				updateAverageRating(location._id);
				sendJsonResponse(res, 204, null);
			}).catch(function (err) {
				sendJsonResponse(res, 404, err);
			});
		} else {
			sendJsonResponse(res, 404, {"message": "No review to delete"});
		}
	}).catch(function (err) {
		return sendJsonResponse(res, 400, err);
	});
};

//module.exports.reviewsDeleteOne = function (req, res) {
//	if (!req.params.locationid || !req.params.reviewid) {
//		sendJsonResponse(res, 404, {"message": "Not found, locationid and reviewid are both required"});
//		return;
//	}
//	Loc.findById(req.params.locationid).select('reviews').exec(function(err, location) {
//		if (!location) {
//			sendJsonResponse(res, 404, {"message": "locationid not found"});
//			return;
//		} else if (err) {
//			sendJsonResponse(res, 400, err);
//			return;
//		}
//		if (location.reviews && location.reviews.length > 0) {
//			if (!location.reviews.id(req.params.reviewid)) {
//				sendJsonResponse(res, 404, {"message": "reviewid not found"});
//			} else {
//				location.reviews.id(req.params.reviewid).remove();
//				location.save(function (err) {
//					if (err) {
//						sendJsonResponse(res, 404, err);
//					} else {
//						updateAverageRating(location._id);
//						sendJsonResponse(res, 204, null);
//					}
//				});
//			}
//		} else {
//			sendJsonResponse(res, 404, {"message": "No review to delete"});
//		}
//	});
//};

var sendJsonResponse = function(res, status, content) {
	res.status(status);
	res.json(content);
};

var doAddReview = function(req, res, location) {
	location.reviews.push({
		author: req.body.author,
		rating: req.body.rating,
		reviewText: req.body.reviewText
	});
	location.save().then(function (location) {
		updateAverageRating(location._id);
		var thisReview = location.reviews[location.reviews.length - 1];
		sendJsonResponse(res, 201, thisReview);
	});
};

var updateAverageRating = function(locationid) {
	Loc.findById(locationid).select('rating reviews').exec().then(doSetAverageRating);
};

var doSetAverageRating = function(location) {
	if (location.reviews && location.reviews.length > 0) {
		var averageRating = _.reduce(location.reviews, function (sum, i) {
			return sum + i;
		}, 0) / location.reviews.length;
		var ratingAverage = parseInt(averageRating, 10);
		location.rating = ratingAverage;
		location.save().then(function() {
			console.log("Average rating updated to ", ratingAverage);
		}).catch(function (err) {
			console.error(err); // don't really care, it will get updated eventually
		});
	}
};

