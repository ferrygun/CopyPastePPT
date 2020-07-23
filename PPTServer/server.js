"use strict";
const fs = require('fs');
const port = process.env.PORT || 3000;
const server = require("http").createServer();
const express = require("express");
const request = require('request');
const imageToBase64 = require('image-to-base64');
const bodyParser = require("body-parser");
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
var socketid;
var Ar = [];

if (process.argv.length === 2) {
  console.error('Expected at least one argument!');
  process.exit(1);
}

var local_server = process.argv[2];

const IMG_URL = local_server + "/cut"
const child_process = require('child_process');

// Redirect any to service root
app.get("/", (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/html'
    });
    res.write('<h1>Cut and Paste to PowerPoint</h1>');
    res.end();
});

app.post('/', function(req, res) {
    connect.handleMessage(req, res, onMessage)
})

//Start the Server 
server.on("request", app);

// use socket.io
var io = require('socket.io').listen(server);

// define interactions with client
io.sockets.on("connection", function(socket) {

    socket.on('client_data', function(msg) {
        var base64String = msg.base64;
        var base64Image = base64String.split(';base64,').pop();

        var fileName = 'image.png'
        fs.writeFile(fileName, base64Image, {
            encoding: 'base64'
        }, function(err) {
            console.log('File created: image.png');

            var formData = {
                'data': fs.createReadStream(fileName)
            };
            var uploadOptions = {
                "url": IMG_URL,
                "method": "POST",
                "formData": formData,
                "headers": {
                    'Content-Type': 'image/png',
                },
                "encoding": 'binary'
            }
            var req = request(uploadOptions, function(err, resp, body) {
                if (err) {
                    console.log('Error ', err);
                } else {
                    //console.log('upload successful', body)

                    fs.writeFile('result.png', body, 'binary', function(err) {
                        console.log('File created: result.png');

						child_process.exec('fcopy.bat result.png', function(error, stdout, stderr) {
							console.log(stdout);
							io.emit("req", {
								base64: 'sendimg'
							});
						});
                    });
                }
            });
        });

    });

    socket.on('disconnect', function() {
        console.log("Disconnected: " + socket.id);

        //remove it from array
        var rmindex = Ar.findIndex(x => x.socketid == socket.id);
        Ar.splice(rmindex, 1);

        console.log(Ar);
    });
});

//Start the Server 
server.listen(port, function() {
    console.info(`PPT Server: ${server.address().port}`);
});
