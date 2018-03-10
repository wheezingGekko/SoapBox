const OTHER_USER = "otherUser";

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

function addUser(user){
    $('.users ul').append(
        (($('<li></li>')
            .append($('<div/>')
                .addClass("circle")))
            .append(($('<div/>')
                .text(user))
                .addClass('username'))));
}

function flushUserList(users){
    $('.users ul').empty();
    for (let i = 0; i < users.length; i++) addUser(users[i].name);
}

function addMessage(user, msg, time, owner){
    let name = user['name'];
    let messageClass = "";

    if (owner === 'self') {
        name += " (You!)";
        messageClass = 'ownMessage';
    }
    else if (owner === OTHER_USER){
        console.log('darn');
        messageClass = 'normalMessage';
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


function populateMessages(messages){
    for (let i = 0; i < messages.length; i++){
        addMessage(messages[i]['user'], messages[i]['msg'], messages[i]['time'], OTHER_USER);
    }
}

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

    socket.on('user connected', function(userName, users){
        flushUserList(users);
        createAlertMessage(userName + " has connected!");
    });

    socket.on('self connected', function(userName, users, messages){
        flushUserList(users);

       $('span.username').text(userName);
        if (messages.length > 0)
            populateMessages(messages);
       createAlertMessage("You have connected!");
    });

    socket.on('user disconnected', function(userName, users){
        flushUserList(users);
        createAlertMessage(userName + " has disconnected!");
    });


    socket.on('change color', function(name, nickColor){
        if (validTextColour(nickColor)){
            $('div.username:contains("' + name + '")').css("border-color",nickColor);
            socket.emit('successful color', name, nickColor);
        }
        else{
            let msg = "We can't use that color, sorry!";

            addMessage({'name': 'YAMMY-BOT', 'color':'#bdd8e8'}, msg, "", OTHER_USER);
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
        addMessage({'name': 'YAMMY-BOT', 'color':'#bdd8e8'}, msg, "", OTHER_USER);
    })
});