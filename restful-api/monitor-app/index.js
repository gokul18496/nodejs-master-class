/*
 * Primary file for API
 *
*/


// Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const fs = require('fs');

const config = require('./config');

// Setup server -> http
const httpServer = http.createServer((req, res)=> {
    unifiedServer(req, res);
});

const httpsServerOptions = {
    'key': fs.readFileSync('./https/key.pem'),
    'cert': fs.readFileSync('./https/cert.pem')
};

// Setup server -> https
const httpsServer = https.createServer(httpsServerOptions, (req, res)=> {
    unifiedServer(req, res);
});

// Start http server
httpServer.listen(config.httpPort, () => {
    console.log('The http server is listening on port ' + config.httpPort + ' in ' + config.envName + ' environment');
});

// Start https server
httpsServer.listen(config.httpsPort, () => {
    console.log('The https server is listening on port ' + config.httpsPort + ' in ' + config.envName + ' environment');
});


// Complete server logic for both http and https servers
const unifiedServer = ((req, res) => {

    // Get and parse URL
    const parsedUrl = url.parse(req.url, true);

    // Get path
    const path  = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g, '');

    // Get query string as an object
    const queryStringObject = parsedUrl.query;

    // Get http method
    const method = req.method.toUpperCase();
   
    // Get headers as an object
    const headers = req.headers;

    // Get payload, if any
    const decoder = new StringDecoder('utf-8');
    let buffer = '';
    req.on('data', (data) => {
        buffer += decoder.write(data);
    });
    req.on('end', () => {
        buffer += decoder.end();

        // Choose the handler this request should go to and handle 404
        const chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

        // Construct the data object and send to handler
        const data = {
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method': method,
            'headers': headers,
            'payload': buffer
        };

        chosenHandler(data, (statusCode, payload) => {
            // Handle status code
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

            // Handle payload
            payload = typeof(payload) == 'object' ? payload : {};

            // Convert payload to string
            const payloadString = JSON.stringify(payload);
            
            // Send response
            res.setHeader('Content-Type','application/json')
            res.writeHead(statusCode);
            res.end(payloadString)
           
            // Log request
            // console.log('Request Received \n Path: ' + trimmedPath + ' \n Method: ' + method + ' \n Query String: ', queryStringObject , ' \n Headers: ', headers, ' \n Payload: ', buffer);
            console.log('Returning this response: ', statusCode, payloadString);
        });

    });
});

// Define the handlers
const handlers = {};

handlers.ping = ((data, callback) =>{
    callback(200);
});

// 404 handler
handlers.notFound = ((data, callback) => {
    callback(404);
});

// Define a request router
const router = {
    'ping' : handlers.ping
}