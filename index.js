const CHANGE_NICK = "/nick ";
const CHANGE_COLOR = "/nickcolor ";

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var cookies = require('cookie-parser');
var port = process.env.PORT || 3000;
var path = require('path');

app.use(express.static(path.join(__dirname, '/public')));
app.use(cookies());

function makeTimeStamp(){
    let time = "";

    let msTime = new Date();
    let tYear = msTime.getFullYear();
    let tMonth = msTime.getMonth();
    let tDate = msTime.getDate();
    //let tDay = msTime.getDay();
    let tHour = msTime.getHours();
    let tMin = msTime.getMinutes();

    let mon = "";
    switch(tMonth){
        case 0:
            mon = "January";
            break;
        case 1:
            mon = "February";
            break;
        case 2:
            mon = "March";
            break;
        case 3:
            mon = "April";
            break;
        case 4:
            mon = "May";
            break;
        case 5:
            mon = "June";
            break;
        case 6:
            mon = "July";
            break;
        case 7:
            mon = "August";
            break;
        case 8:
            mon = "September";
            break;
        case 9:
            mon = "October";
            break;
        case 10:
            mon = "November";
            break;
        case 11:
            mon = "December";
            break;
    }

    // hour is not military
    if (tHour > 11) {
        if (tHour > 12)
            tHour %= 12;
        time += " PM";
    }
    else
        time += " AM";

    // minutes
    if (tMin < 10)
        tMin = "0" + tMin;

    // displays -> hr:min AM/PM
    time = mon + " " + tDate + " " + tYear + ", " + tHour + ":" + tMin + time;

    return time;
}

function createName(){
    let newName = "";

    while (newName in Object.values(userList) || newName === "") {
        newName = "dude" + Math.floor((Math.random() * 1000) + 1);
    }

    return newName;
}


/*
function addUserToList(n) {
    var listObj = document.createElement("LI");
    var circle = document.getElementsByClassName("circle");
    var textObj = document.createTextNode(n);

    var userListObj = document.getElementById("user_list")

    listObj.appendChild(circle);
    listObj.appendChild(textObj);
    document.

    // Adds an element to the document
    var p = document.getElementById(parentId);
    var newElement = document.createElement(elementTag);
    newElement.setAttribute('id', elementId);
    newElement.innerHTML = html;
    p.appendChild(newElement);
}
*/
function removeUserFromList(){

}



var userList = [];

var User = class User {

    constructor(sock, name){
        this.sock = sock;
        this.name = name;
        this.color = "black";
    }
};

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){

    if (!(socket in userList))
        userList['socket'] = new User(socket, createName());

    io.emit('user connected', userList.socket.name);

    io.emit('chat message', userList.socket.name + " has connected");

    socket.on('chat message', function(msg){
        let param = msg.split(" ", 2)[1];

        // change the color of the message if it starts with "/nickcolor "
        if (msg.startsWith(CHANGE_COLOR)){

            userList.socket.color = param;
            io.emit('change color', param);

            console.log("Change color to: " + userList.socket.color);
        }

        // change the name of the user if it starts with "/nick "
        else if (msg.startsWith(CHANGE_NICK)){
            userList.socket.name = param;
            console.log(param);
        }

        // otherwise, just have it as a regular message
        else {
            io.emit('chat message', userList.socket.name + ": " + msg + " at " + makeTimeStamp(), userList.socket.color);
            console.log(makeTimeStamp());
        }

    });

    /*
    socket.on('incorrect parameter', function(){
      socket.emit('chat message', "")
    })
    */

    socket.on('disconnect', function(){
        io.emit('chat message', userList.socket.name + " has disconnected");
    })
});

http.listen(port, function(){
    console.log('listening on *:' + port);
});
