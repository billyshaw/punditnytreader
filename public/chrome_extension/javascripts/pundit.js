// Main function
function main() {
	makeCorsRequest();
	startTime();
}

// Create the XHR object.
function createCORSRequest(method, url) {
  var xhr = new XMLHttpRequest();
  if ("withCredentials" in xhr) {
    // XHR for Chrome/Firefox/Opera/Safari.
    xhr.open(method, url, true);
  } else if (typeof XDomainRequest != "undefined") {
    // XDomainRequest for IE.
    xhr = new XDomainRequest();
    xhr.open(method, url);
  } else {
    // CORS not supported.
    xhr = null;
  } 
  return xhr;
}

// Make the actual CORS request.
function makeCorsRequest() {

  // All HTML5 Rocks properties support CORS.
  var url = 'https://pundit-nyt-reader.herokuapp.com/';


  var xhr = createCORSRequest('GET', url);
  if (!xhr) {
    alert('CORS not supported');
    return;
  }

  // Response handlers.
  xhr.onload = function() {
    var text = xhr.responseText;
    process_data(JSON.parse(text));
  };

  xhr.onerror = function() {
    alert('Woops, there was an error making the request.');
  };

  xhr.send();
}

// Function to process data and send to HTML using DOM
function process_data(data) {

	var this_media = data[0].medias;
	var index = data[0].media_index;
	console.log(this_media[index].url);

	// Set background image
	var background = document.getElementById('bg');
	background.setAttribute("src", this_media[index].url);

	// Set caption
	var caption = document.getElementById('img_caption');
	caption.innerHTML = this_media[index].caption;


	// Set title
	var title = document.getElementById('title');
	title.innerHTML = data[0].title;

	// Set abstract
	var caption = document.getElementById('caption');
	caption.innerHTML = data[0].abstract;

	// Set link
	var link = document.getElementById('link');
	link.setAttribute('href', data[0].url);

}


function startTime() {
    var today = new Date();
    var h = today.getHours();
    var m = today.getMinutes();
    var s = today.getSeconds();

    var ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (ampm == 'PM') {h = h ?  h : 12;} // Hour '0' should be '12'
    m = checkTime(m);
    // console.log('hi');
    // console.log(h+":"+m+":"+s+" "+ampm);

    //document.getElementById('clock').innerHTML = h+":"+m+""+ampm;
    var t = setTimeout(function(){startTime()},500);

    months = ['January','February','March','April','May','June','July','August','September','October','November','December'],
    days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    var month = months[today.getMonth()];
    var day = today.getDate();
    document.getElementById('date').innerHTML = month + " " + day + ", " + today.getFullYear();
}

function checkTime(i) {
    if (i < 10) {i = "0" + i};  // add zero in front of numbers < 10
    return i;
}

document.addEventListener('DOMContentLoaded', main);