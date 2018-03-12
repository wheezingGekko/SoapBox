const SELF = 'self';
const OTHER_USER = "otherUser";
const YAMMY = "yammy";

/**
 *  author: https://stackoverflow.com/questions/6386090/validating-css-color-names
 *
 *  checks if the color exists
 *
 * @param stringToTest
 * @returns {boolean}
 */
function validTextColour(stringToTest) {
    //Alter the following conditions according to your need.
    if (stringToTest === "") { return false; }
    if (stringToTest === "inherit") { return false; }
    if (stringToTest === "transparent") { return false; }

    var image = document.createElement("img");
    image.style.color = "rgb(0, 0, 0)";
    image.style.color = stringToTest;
    if (image.style.color !== "rgb(0, 0, 0)") { return true; }
    image.style.color = "rgb(255, 255, 255)";
    image.style.color = stringToTest;
    return image.style.color !== "rgb(255, 255, 255)";
}

/**
 * Adds a user to the user list on the right section of the screen
 *
 * @param user
 */
function addUser(user){
    $('.users ul').append(
        (($('<li></li>')
            .append($('<div/>')
                .addClass("circle")))
            .append(($('<div/>')
                .text(user))
                .addClass('username'))));
}

/**
 * Removes a list of users from the right section of the screen
 *
 * @param users
 */
function flushUserList(users){
    $('.users ul').empty();
    for (let i = 0; i < users.length; i++) addUser(users[i].name);
}

/**
 * Adds a message box to the screen
 *
 * @param user  - the nickname of the user
 * @param msg   - the message of the user
 * @param time  - the time it was written
 * @param owner - whether or not it was the user themselves or another person
 */
function addMessage(user, msg, time, owner){
    let name = user.name;
    let messageClass = "";

    if (owner === SELF) {
        name += " (You!)";
        messageClass = 'ownMessage';
    }
    else if (owner === OTHER_USER){
        messageClass = 'normalMessage';
    }
    else if (owner === YAMMY){
        messageClass = 'yamMessage';
    }
    else { console.log('oh no'); }

    let messageBox = $('#messages');

    messageBox.prepend(((
        $('<li>')
            .append(((
                $('<div>')
                    .text(name)
                    .css('border-color', user.color))
                .addClass('username')))
            .append($('<div>')
                .text(msg)
                .addClass('message')))
            .append($('<div>')
                .text(time)
                .addClass('timestamp')))
        .addClass(messageClass));

    messageBox.scrollTop(messageBox[0].scrollHeight);
}

/**
 * Repopulates the message window with at least 200 of the past messages
 * Does not distinguish if a message was written by the current user
 *
 * @param messages  all messages that have been written
 * @param name
 */
function populateMessages(messages, name){
    for (let i = 0; i < messages.length; i++) {
        if (name === messages[i]['user'].name)
            addMessage(messages[i]['user'], messages[i]['msg'], messages[i]['time'], SELF);
        else
            addMessage(messages[i]['user'], messages[i]['msg'], messages[i]['time'], OTHER_USER);
    }
}

/**
 * Writes a main message on the screen
 *
 * @param message
 */
function createAlertMessage(message){

    let messageBox = $('#messages');

    messageBox.prepend(
        ($('<li>').append($('<div>')
            .text(message)
            .addClass('eventMessage')
    )));

    messageBox.scrollTop(messageBox[0].scrollHeight);
}

$(function () {
    let socket = io();
    $('form').submit(function(){
        socket.emit('chat message', $('#m').val());
        $('#m').val('');
        return false;
    });

    socket.on('throw cookies', function(nom){
        document.cookie = nom;
    });

    socket.on('chat message', function(user, msg, time){
        addMessage(user, msg, time, OTHER_USER);
    });

    socket.on('own chat message', function(user, msg, time){
        addMessage(user, msg, time, 'self');
    });

    socket.on('user connected', function(name, users){
        flushUserList(users);
        createAlertMessage(name + " has connected!");
    });

    socket.on('self connected', function(name, users, messages){
        flushUserList(users);

       $('span.username').text(name);
        if (messages.length > 0)
            populateMessages(messages, name);
       createAlertMessage("You have connected!");
    });

    socket.on('user disconnected', function(name, users){
        flushUserList(users);
        createAlertMessage(name + " has disconnected!");
    });


    socket.on('change color', function(name, nickColor){
        if (validTextColour(nickColor)){
            $('div.username:contains("' + name + '")').css("border-color",nickColor);
            socket.emit('successful color', name, nickColor);
        }
        else{
            let msg = "We can't use that color, sorry!";

            addMessage({'name': 'YAMMY-BOT', 'color':'#ffd4dd'}, msg, "", YAMMY);
        }
    });

    socket.on('change nick', function(oldName, newName){
        $('div.username:contains("' + oldName + '")').text(newName);
    });

    socket.on('self change nick', function(oldName, newName){
        $('div.username:contains("' + oldName + '")').text(newName + " (You!)");
        $('span.username').text(newName);
    });

    socket.on('nick change alert', function(msg){
        createAlertMessage(msg);
    });

    socket.on('yammy message', function(msg){
        addMessage({'name': 'YAMMY-BOT', 'color':'#ffd4dd'}, msg, "", YAMMY);
    })
});