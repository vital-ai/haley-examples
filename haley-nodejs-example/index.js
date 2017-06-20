if(!process.env.haley_username) {
	console.log("Error: Specify haley_username in environment");
	process.exit(1);
}

if(!process.env.haley_password) {
	console.log("Error: Specify haley_password in environment");
	process.exit(1);
}

if(!process.env.haley_appID) {
	console.log("Error: Specify haley_appID in environment");
	process.exit(1);
}

if(!process.env.haley_eventbusURL) {
	console.log("Error: Specify haley_eventbusURL in environment");
	process.exit(1);
}

if(!process.env.haley_endpointURI ) {
	console.log("Error: Specify haley_endpointURI in environment");
	process.exit(1);
}

if(!process.env.haley_channelURI ) {
	console.log("Error: Specify haley_channelURI in environment");
	process.exit(1);
}

var haley_username = process.env.haley_username;
var haley_password = process.env.haley_password;
var haley_appID = process.env.haley_appID;
var haley_eventbusURL = process.env.haley_eventbusURL;
var haley_endpointURI = process.env.haley_endpointURI;
var haley_channelURI = process.env.haley_channelURI;


console.log("haley_username: ", haley_username);
console.log("haley_password: ", haley_password);
console.log("haley_appID: ", haley_appID);
console.log("haley_eventbusURL: ", haley_eventbusURL);
console.log("haley_endpointURI: ", haley_endpointURI);
console.log("haley_channelURI: ", haley_channelURI);


//import haley api with dependencies publicly
console.log("Importing vital dependencies publicly ...");

var VitalService = require('./lib-vital/vitalservice-js/vitalservice-0.2.304.js');
var HaleyAPI = require('./lib-vital/haley-js-api/haley-js-api-0.0.1.js');
var HaleyAPIVitalServiceImpl = require('./lib-vital/haley-js-api/haley-js-vitalservice-implementation-0.0.1.js');


var haleyApi = null;
var haleySession = null;

var vitalService = new VitalService('endpoint.' + haley_appID, haley_eventbusURL, function(){

    //success
    console.log("vitalservice ready, ", vitalService);
	
	
    console.log('adding entity and relationship classes as exceptions for json validation');
    VitalServiceJson.SINGLETON.dynamicPropertiesClasses.push('http://vital.ai/ontology/vital-aimp#Entity');
    VitalServiceJson.SINGLETON.dynamicPropertiesClasses.push('http://vital.ai/ontology/vital-aimp#Edge_hasRelationship');
	
    var haleyApiImpl = new HaleyAPIVitalServiceImpl(vitalService);
    haleyApiImpl.logEnabled = false;
	
    haleyApiImpl.addReconnectListener(function(){

	console.log("Reconnect listener called");
		
    });
	
    //HaleyAPI = function(implementation, syncdomains, callback) {
    new HaleyAPI(haleyApiImpl, false, function(error, _haleyInstance){

	if(error) {
	    console.error("Error when creating haley API instance: " + error);
	    return;
	}
	console.info("Haley API instance created");
	haleyApi = _haleyInstance;
			
	haleyApi.openSession(function(error, _haleySession){
			
	    if(error) {
		vital.error("Error when checking session: " + error);
				
		app.onLoggedOut();
				
		return;
	    }
			
	    console.log("haley session opened", _haleySession);
			
	    haleySession = _haleySession;
		
	    try {
				
		var r = haleyApi.registerCallback(haleySession, 'http://vital.ai/ontology/vital-aimp#AIMPMessage', true, facebookOutgoingMessageHandler);
				
		if(!r) throw "Messages handler not registered!";
		
	    } catch(e) {
		console.error("Couldn't register handler: " + e);
	    }
			
			
			
	    if( haleySession.isAuthenticated() ) {

		var data = haleySession.getAuthAccount();
				
		console.log("Session already authenticated: ", data);
				
		onSessionAuthenticated();
				
	    } else {
				
				
		console.info("Session not authenticated - authenticating");
				
		haleyApi.authenticateSession(haleySession, haley_username, haley_password, function(error, loginObject){
					
		    if(error) {
			console.error("Error when authenticating user: " + error);
			return;
		    }
					
		    console.log("session authenticated: ", loginObject);
		    
		    onSessionAuthenticated();
					
		});
				
	    }
			
	});
		
		
		
    });
	
}, function(error){
    console.error("vitalservice error");
});

var fs = require('fs');

function onSessionAuthenticated() {
	
    console.log("Haley session ready");
	
    // Load the http module to create an http server.
    var http = require('http');

    // Configure our HTTP server to respond with Hello World to all requests.
    var server = http.createServer(function (request, response) {
	var url = request.url;
	var method = request.method;
	//static files
	console.log('request:', method + ' ' + url);
	if(method == 'GET' && ( url == '/' || url == '/index.html' || url == '/app.js')) {
			
	    var file = url.substring(1);
	    if(file.length == 0) file = 'index.html';
			
	    var contentType = 'text/html';
	    if(file.endsWith('.js')) {
		contentType = 'application/json';
	    }
			
	    fs.readFile('./www/' + file, 'utf8', function (err,data) {
		if (err) {
		    console.log(err);
		    response.writeHead(404);
		    response.end('Not found!');
		    return;
		}
		response.writeHead(200, { 'Content-Type': contentType });
		response.end(data);
	    });
	    return;
			
	} else if(method == 'POST' && ( url == '/classify')) {
					
	    var queryData = "";
	    request.on('data', function(data) {
	        queryData += data;
	        if(queryData.length > 1e6) {
	            queryData = "";
	            response.writeHead(413, {'Content-Type': 'text/plain'}).end();
	            request.connection.destroy();
	        }
	    });

	    request.on('end', function() {
	            
	        var requestObj = JSON.parse(queryData);
	        console.log('request object', requestObj)
	        	
	        if(url == '/classify') {

	            classification(requestObj.text, function(error, categories){
	        			
	        	var resp = {ok: error == null, results: []};
	        			
	        	if(error) {
	        	    console.error(error);
	        	    resp.message = error;
	        	} else {
	        	    console.log("categories", categories);
	        				
	        	    for(var i = 0 ; i < categories.length; i++) {
	        		var category = categories[i];
	        		var r = {
		        	    URI: category.URI,
		        	    name: category.get('name'),
		        	    score: category.get('targetScore'),
		        	    stringValue: category.get('targetStringValue'),
		        	    doubleValue: category.get('targetDoubleValue')
		        	};
	        					
	        		resp.results.push(r);
	        	    }
	        	    
	        	}
	        			
	    	        response.writeHead(200, {'Content-Type': 'application/json'});
	    	        response.end(JSON.stringify(resp));
	        			
	            });
	        		
	            return;
	        }
	        	
	        response.writeHead(500, {});
	        response.end('UNHANDLED POST URL: ' + url);
	        	
	    });
	    return;
	}
	response.writeHead(404, {});
	response.end("NOT FOUND");
    });

    // Listen on port 8000, IP defaults to 127.0.0.1
	server.listen(8002);

    // Put a friendly message on the terminal
    console.log("Server running at http://127.0.0.1:8002/");
}

function classification(text, closure) {
	
	
	var intentMessage = vitaljs.graphObject({type: 'http://vital.ai/ontology/vital-aimp#IntentMessage'});
	intentMessage.URI = 'urn:' + new Date().getTime() + '_' + Math.round(Math.random() * 10000);
	intentMessage.set('intent', 'classify');
	intentMessage.set('propertyValue', text);
	intentMessage.set('channelURI', haley_channelURI);
		
	var timeout = setTimeout(function(){
		closure('Classify request timed out (15,000ms)', null);
		timeout = null;
	}, 15000);
	
	haleyApi.sendMessageWithRequestCallback(haleySession, intentMessage, [], function(error){
	    
	    if(error) {
		console.error("Error when sending intent request message: ", error);
		closure(error, null);
	    } else {
		console.log("intent request sent successully.");
	    }
		
	}, function(msgRL){
		
	    if(timeout != null) {
		clearTimeout(timeout);
		timeout = null;
	    } else {
		console.warn("Already timed out");
		return false;
	    }
		
	    //VirtualLoginResponseMessage 
	    var res = msgRL.first();
		
	    var status = res.get('text');
	    if(status == null) status = '';
		
	    if(status.toLowerCase() !== 'ok') {
		var error = status ? status : '(unknown error)';
		console.error(error);
		closure(error, null);
		return false; 
	    }

		
	    //dialog returns target nodes (categories)
	    var entities = msgRL.iterator('http://vital.ai/ontology/vital-nlp#TargetNode');
		
	    closure(null, entities);
		
	    //no more messages expected
	    return false;
		
	});
}
