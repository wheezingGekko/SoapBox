/** IMPORTED PACKAGES **/

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var cookieParser = require('socket.io-cookie-parser');
var port = process.env.PORT || 3000;
var path = require('path');


/** SERVER-RELATED **/

app.use(express.static(path.join(__dirname, '/public')));

io.use(cookieParser());

/*
app.get('/list', function(req, res){
    res.send(req.cookies);
});
*/

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});


/** VAR **/

const CHANGE_NICK = "/nick ";
const CHANGE_COLOR = "/nickcolor ";

const MONTH_NUM_TO_NAME = {
   0: "January",
   1: "February",
   2: "March",
   3: "April",
   4: "May",
   5: "June",
   6: "July",
   7: "August",
   8: "September",
   9: "October",
   10: "November",
   11: "December"
};

const entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
};


/**
 * author: https://stackoverflow.com/questions/24816/escaping-html-strings-with-jquery
 *
 * Provides one measure of ensuring that the string passed within is not hazardous
 *
 * @param dirtyString - possibly dangerous string
 * @returns string - cleaned
 */
function sanitize(dirtyString) {
    return String(dirtyString).replace(/[&<>"'`=\/]/g, function (s) {
        return entityMap[s];
    });
}

/**
 * Creates a string of the time that a message has been posted
 *
 * @returns string
 */
function makeTimeStamp(){
    let time = "";

    let msTime = new Date();
    let tYear = msTime.getFullYear();
    let tMonth = MONTH_NUM_TO_NAME[msTime.getMonth()];
    let tDate = msTime.getDate();
    //let tDay = msTime.getDay();
    let tHour = msTime.getHours();
    let tMin = msTime.getMinutes();

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
    return (tMonth + " " + tDate + " " + tYear + ", " + tHour + ":" + tMin + time);
}

/**
 * Randomly composes a default name for a user
 *  DUDE + ###
 *
 * @returns {string}
 */
function createName(){
    let newName = "";

    while (newName in Object.values(userList) || newName === "") {
        newName = "dude" + Math.floor((Math.random() * 1000) + 1);
    }

    return newName;
}

function createCookie(chips){
    let d = new Date();
    d.setTime(d.getTime() + (2 * 24 * 60 * 60 * 1000));
    let expires = "expires="+d.toUTCString();

    console.log("nick=" + chips + ";" + expires + ";path=/");

    return "nick=" + chips + ";" + expires + ";path=/";
}

var userList = {};
var messageList = [];

class User {
    constructor(socketID, name){
        this.socketID = socketID;
        this.name = name;
        this.color = "black";
    }

    hasSameName(anotherName){
        return this.name === anotherName;
    }
}

function userExists(name){
    for (let i = 0; i < Object.values(userList).length; i++){
        if (Object.values(userList)[i].hasSameName(name)) return true;
    }
    return false;
}

io.on('connection', function(socket){

    let ID = "";

    if (socket.request.cookie === undefined){
        ID = createName();
        userList[ID] = new User(socket.id, ID);
        socket.emit('throw cookies', createCookie(ID));
    }
    else{
        ID = socket.request.cookie.nick;
    }

    io.emit('user connected', userList[ID].name, Object.values(userList), messageList);
    socket.emit('self connected', ID);

    socket.on('chat message', function(msg){

        let param = sanitize(msg.split(" ")[1]);

        /** Change color of the nickname **/
        if (msg.startsWith(CHANGE_COLOR)){
            userList[ID].color = param;
            io.emit('change color', userList[ID].name, userList[ID].color);
        }

        // change the name of the user if it starts with "/nick "
        else if (msg.startsWith(CHANGE_NICK)){

            if (userExists(param))
                socket.emit('name taken', makeTimeStamp());
                //socket.emit('chat message', "nickname, " + param + ", is already taken ):");

            else {
                //io.emit('chat messsage', userList[ID].name + " has changed their name to " + param);
                socket.broadcast.emit('change nick', userList[ID].name, param);
                socket.emit('self change nick', userList[ID].name, param);
                socket.emit('throw cookies', createCookie(param));
                userList[ID].name = param;
            }
        }

        // otherwise, just have it as a regular message
        else {
            let time = makeTimeStamp();
            socket.emit('own chat message', userList[ID], sanitize(msg), time);
            socket.broadcast.emit('chat message', userList[ID], sanitize(msg), time);

            if (messageList.length === 200)
                messageList.shift();

            messageList.push({'user':userList[ID],'msg':msg,'time':time});
        }

    });

    socket.on('disconnect', function(){
        let disconnectedUser = userList[ID].name;
        delete userList[ID];
        io.emit('user disconnected', disconnectedUser, Object.values(userList));
    })
});

http.listen(port, function(){
    console.log('listening on *:' + port);
});