var mongoose = require('mongoose');
var URLSlugs = require('mongoose-url-slugs');
var random = require('mongoose-random');

// Schema 
var Schema = mongoose.Schema, 
	ObjectId = Schema.ObjectId;

var Media = new Schema({
	id: ObjectId,
	type: String,
	subtype: String,
	caption: String,
	copyright: String,
	url: String, 
	format: String,
	height: Number,
	width: Number
});

// Stories from The New York Times API
var API_Stories = new Schema({
	id: ObjectId,
	title: String, 
	abstract: String, 
	url: String, 
	date: Date, 
	is_valid: Boolean,
	stored_by: Date,
	media_index: Number,
	medias: [Media]
});

// Stories Submitted by Users
var Feedback = new Schema({
	id: ObjectId,
	email: String,
	name: String, 
	message: String
});

var Signup = new Schema({
	id: ObjectId,
	email: String,
	name: String
});


API_Stories.plugin(random, { path: 'r' });

mongoose.model('Media', Media);
mongoose.model('API_Stories', API_Stories);
mongoose.model('Feedback', Feedback);
mongoose.model('Signup', Signup);

// Connect to the Database (newster)
mongoose.connect('mongodb://localhost/pundit');

