var express = require('express');
var router = express.Router();

// Use mongojs module to ease mongodb use
var mongojs = require('mongojs');

// Use mongoose-random module to pick a random database item
var random = require('mongoose-random');

var mongoose = require('mongoose'),
	Media = mongoose.model('Media'), 
	API_Stories = mongoose.model('API_Stories'),
	Feedback = mongoose.model('Feedback'),
	Signup = mongoose.model('Signup');

// Use node-schedule module to time API request to update stories database
var schedule = require('node-schedule');
var request = require('request');

var rule = new schedule.RecurrenceRule();
rule.minute = 1;

// Send API request every minute of the hour, 24x a day.


// Main function to send NYT API request`
// Get today's most viewed articles
var j = schedule.scheduleJob(rule, function() {

	invalidate();

	// Request mostemailed
	request('http://api.nytimes.com/svc/mostpopular/v2/mostemailed/all-sections/1.json?api-key=5e06027175ee0100cebc93963b1070af:1:66248329'
		, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
	  	save_stories(JSON.parse(body));
	  	console.log("Called Most Emailed!");
	  }
	});

	// Request mostviewed
	request('http://api.nytimes.com/svc/mostpopular/v2/mostviewed/all-sections/1.json?api-key=5e06027175ee0100cebc93963b1070af:1:66248329'
		, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
	  	save_stories(JSON.parse(body));
	  	console.log("Called Most Viewed!");
	  }
	});

	// Request mostshared
	request('http://api.nytimes.com/svc/mostpopular/v2/mostshared/all-sections/1.json?api-key=5e06027175ee0100cebc93963b1070af:1:66248329'
		, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
	  	save_stories(JSON.parse(body));
	  	console.log("Called Most Shared!");
	  }
	});

    console.log('API called! ' + new Date());
});


// Invalidate all the stories int he database
var invalidate = function() {

	API_Stories.find({is_valid:true}, function(err, docs) {
		docs.forEach(function(story) {
			story.is_valid = false;
			story.save(function(err, doc) {
				if (err) {console.log('Error! ' + err);} 
				else {console.log("Invalidated story! URL is " + doc.url);}
			});
		});
	});	

}


// Save stories as well as do API data validation
var save_stories = function(body) {

	var story_number = 1;

	body.results.forEach(function(story) {


		var new_api_story = new API_Stories({
			title: story.title,
			abstract: story.abstract,
			url: story.url,
			date: story.published_date,
			is_valid: true,
			stored_by: Date.now(), 
			media_index: 0
		});

		// console.log(new_api_story);
		// Loop through story media and make a new media object
		for (var i = 0; i < story.media.length; i++) {

			// Only model media with copyright & caption
			// Only pick images with width above 2000 to maximize experience
			if (story.media[i].copyright != '' && 
				story.media[i].caption != '') {

				var new_media = new Media({

					// Model all basic information
					type: story.media[i].type,
					subtype: story.media[i].subtype,
					caption: story.media[i].caption + " Source: The New York Times Company",
					copyright: story.media[i].copyright
					
				});

				// Loop through the media urls 
				// and pick superJumbo to add to new_media object
				var this_media = story.media[i]['media-metadata'];
				for (var q = 0; q < this_media.length; q++) {
					if (this_media[q].format == 'superJumbo') {
						new_media.url = this_media[q].url,
						new_media.format = this_media[q].format,
						new_media.height = this_media[q].height,
						new_media.width =  this_media[q].width	
					}
				}

				// Only model images wider than 2000px for experience
				if (new_media.width > 2000) {
					new_api_story.medias.push(new_media);
				}

			}

		}

		// Find if existing new_api_story already exists in database.
		// Only save new stories and stories with media images
		API_Stories.find({url: new_api_story.url}, function(err, find_story, count) {
			// If stories already exist in database, validate
			if (find_story.length > 0) {
				find_story.forEach(function(v_story) {
					console.log('Validated story! URL is ' + v_story.url);
					v_story.is_valid = true;
					v_story.save(function(err, doc) {
						if (err) {console.log('Error! ' + err);} 
						else {console.log("Invalidated story! URL is " + doc.url);}
					});
				});
			}
			if (find_story.length == 0 && new_api_story.medias.length != 0) {
				new_api_story.save(); // Save
				console.log('Success! New story saved. URL is ' + new_api_story.url);
			}
		});

		// console.log(new_api_story);
		story_number++;

	});
}

// Route handler #1
// Use CORS for Cross-Domain AJAX request
router.use(function(req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    return next();
 });

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

// Route handler #2
/* GET home page. Send back JSON-formatted stories as response */
router.get('/', function(req, res) {

	var date = new Date();
	var lastweek = date.getDate() - 3;
	date.setDate(lastweek);
	console.log("Last week's date is: " + date);

	API_Stories.syncRandom(function (err, result) {
	  console.log(result.updated);
	});

	var output = [];

	// Use Mongoose-Random to randomly pick a valid story
	API_Stories.findRandom({is_valid:true}).limit(5).exec(function (err, docs) {

		// If there are more than 1 media, randomly select
	  	for (var m = 0; m < 5; m++) {

	  		if (typeof(docs[m]) == 'object') {
		  		// If there are more than 1 media, randomly select	  		
		  		if (docs[m].medias.size > 1) {
		  			console.log("The length is: "+ docs[m].medias.length);
		  			var l = docs[m].medias.size;
		  			console.log('Size is ' + l);
		  			docs[m].media_index = Math.floor(Math.random() * l);
		  			console.log(docs[m].media_index);
		  		} 
				output.push(docs[m]);
	  		}
		}
		res.send(JSON.stringify(output));
	});
});

// Serve Static Files
var path = require("path");
var publicPath = path.resolve(__dirname, "public");

// Route handler #3
router.use(express.static(publicPath));

// Route handler #4
router.get('/pundit', function(req,res){

	res.render('pundit.hbs');

});

// Route handler #5: Get feedback message and send reply email!
router.post('/pundit', function(req,res) {

	res.send("Thanks for reaching out!")

	var new_feedback = new Feedback({
			email: req.body.email,
			name: req.body.name, 
			message: req.body.message
	});

	new_feedback.save(function(err, doc) {
		if (err) {console.log('Error! ' + err);} 
		else {console.log("Invalidated story! URL is " + doc.url);}
	});

	// Use nodemailer to send email
	var nodemailer = require('nodemailer');

	// create reusable transporter object using SMTP transport
	var transporter = nodemailer.createTransport();

	// setup e-mail data with unicode symbols
	var mailOptions = {
	    from: 'Pundit NYT Reader <billy@thedailypundit.com>', // sender address
	    to: "" + req.body.email + ", billy@thedailypundit.com", // list of receivers
	    subject: 'Thanks for the Feedback! ', // Subject line
	    text: 'Thanks for reaching out! Really appreciate it. - Billy Shaw Susanto '  + req.body.name + ": " + req.body.message , // plaintext body
	    html: '<b>I appreciate your feedback on the app. - Billy Shaw Susanto </b> </br>' + req.body.name + ": " + req.body.message // html body
	};

	// send mail with defined transport object
	transporter.sendMail(mailOptions, function(error, info){
	    if(error){
	        console.log(error);
	    } else{
	        console.log('Message sent: ' + info.response);
	    }
	});


});

// Route handler #6: Render signup page
router.get('/signup', function(req, res) {

	res.render('signup');

});

// Helper function to check if there is email in string - for validation
function checkIfEmailInString(text) { 
    var re = /(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;
    return re.test(text);
}

// Route handler #7: Handle signups
router.post('/signup', function(req, res) {

	// Do server validation of email address
	if (checkIfEmailInString(req.body.email) == false) {
		res.send("false");
	} else {
		res.send("true");
		// Create & save new model
		var signup = new Signup ({
			email: req.body.email,
			name: req.body.name
		});
		signup.save(function(err, doc) {
			if (err) {console.log('Error! ' + err);} 
			else {console.log("Invalidated story! URL is " + doc.url);}
		});
	}

});

module.exports = router;
