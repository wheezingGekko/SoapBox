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
app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

io.use(cookieParser());



/** VAR **/

const CHANGE_NICK = "/nick ";
const CHANGE_COLOR = "/nickcolor ";
const YAM_NICKNAMES = ["yammy", "yam", "yammy-bot", "yammybot", "yamyam", "yamster", "yammitus", "yamyamyamyam", "yamyamyam"];

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

/**
 *  creates the data of the cookie to be given to the client when requested
 *  takes a nickname, which is meant to be remembered by the chat once
 *  a user disconnects and reconnects
 *
 * @param chips
 * @returns {string}
 */
function createCookie(chips){
    let d = new Date();
    d.setTime(d.getTime() + (2 * 24 * 60 * 60 * 1000));
    let expires = "expires="+d.toUTCString();

    console.log("nick=" + chips + ";" + expires + ";path=/");

    return "nick=" + chips + ";" + expires + ";path=/";
}

var userList = {};
var fakeMessageList = [];
var messageList = [];

/**
 * contains information about a particular user for packaging reasons
 * the socketID is not necessarily useful in this case
 */
class User {
    constructor(socketID, name){
        this.socketID = socketID;
        this.name = name;
        this.color = "#bdd8e8";
    }

    /**
     * checks if another user has the same name as this instance
     *
     * @param anotherName
     * @returns {boolean}
     */
    hasSameName(anotherName){
        return this.name === anotherName;
    }
}

/**
 * checks if a nickname already exists amongst the list of users
 *
 * @param name
 * @returns {boolean}
 */
function userExists(name){
    for (let i = 0; i < Object.values(userList).length; i++){
        if (Object.values(userList)[i].hasSameName(name)) return true;
    }
    return false;
}


class Message {
    constructor(name, msg, time){
        this.name = name;
        this.msg = msg;
        this.time = time;
    }

    condense(){
        return {'user':this.name,'msg':this.msg,'time':this.time};
    }
}

function transformFakeMessageList(){
    messageList = [];

    for (let i = 0; i < fakeMessageList.length; i++){
        messageList.push(fakeMessageList[i].condense());
    }
}

function changeUserInFakeMessageList(oldUser, newUser){
    for (let i = 0; i < fakeMessageList.length; i++){
        if (fakeMessageList.name === oldUser)
            fakeMessageList.name = newUser;
    }
}

io.on('connection', function(socket){

    let ID = "";

    if (socket.request.cookies === undefined){
        ID = createName();
        socket.emit('throw cookies', createCookie(ID));
    }
    else{
        ID = socket.request.cookies.nick;
    }

    userList[ID] = new User(socket.id, ID);

    socket.broadcast.emit('user connected', userList[ID].name, Object.values(userList));


    transformFakeMessageList();
    socket.emit('self connected', ID, Object.values(userList), messageList);
    //socket.emit('self connected', ID, Object.values(userList), messageList);

    socket.on('chat message', function(msg){

        /** splits the parameters so that the user
         *  can have nickname with spaces  **/
        let params = msg.split(" ");
        params = [params.shift(), params.join(" ")];
        let param = params[1];

        /** Change color of the nickname **/
        if (msg.startsWith(CHANGE_COLOR)){
            if (param === "default")
                param = "#bdd8e8";
            io.emit('change color', userList[ID].name, param);
        }

            // change the name of the user if it starts with "/nick "
            else if (msg.startsWith(CHANGE_NICK)){

                if (userExists(param)) {
                    let yMsg = "Someone already has that name, sorry!";
                    socket.emit('yammy message', yMsg);
                }
                else if (YAM_NICKNAMES.includes(param.toLowerCase())){
                    let yMsg = "That's my name...";
                    socket.emit('yammy message', yMsg);
                }
                else {

                    param = sanitize(param);

                    io.emit('nick change alert', userList[ID].name + " has changed their name to " + param + "!");
                    socket.broadcast.emit('change nick', userList[ID].name, param);
                    socket.emit('self change nick', userList[ID].name, param);
                    socket.emit('throw cookies', createCookie(param));

                    changeUserInFakeMessageList(userList[ID].name, param);

                    userList[ID].name = param;
                }
            }

            // otherwise, just have it as a regular message
            else {
                let time = makeTimeStamp();
                socket.emit('own chat message', userList[ID], msg, time);
                socket.broadcast.emit('chat message', userList[ID], msg, time);

                if (messageList.length === 200)
                    messageList.shift();

                fakeMessageList.push(new Message(userList[ID], msg, time));
            }

        });

    socket.on('successful color', function(name, color){
        userList[name].color = color;
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