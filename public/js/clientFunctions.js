const OTHER_USER = "otherUser";

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

    socket.on('user connected', function(userName, users, messages){
        flushUserList(users);

        if (messages.length > 0)
            populateMessages(messages);

        createAlertMessage(userName + " has connected!");
    });

    socket.on('self connected', function(userName){
       $('span.username').text(userName);
    });

    socket.on('user disconnected', function(userName, users){
        flushUserList(users);
        createAlertMessage(userName + " has disconnected!");
    });


    socket.on('change color', function(name, nickColor){
        $('div.username:contains("' + name + '")').css("border-color",nickColor);
    });

    socket.on('change nick', function(oldName, newName){
        $('div.username:contains("' + oldName + '")').text(newName);
    });

    socket.on('self change nick', function(oldName, newName){
        $('div.username:contains("' + oldName + '")').text(newName + " (You!)");
        $('span.username').text(newName);
    });

    socket.on('name taken', function(time){
        addMessage({'user': 'Yammy', 'color':'"blue"'}, "That name is already taken, I'm sorry! D: ~Yammy", time);
    })
});