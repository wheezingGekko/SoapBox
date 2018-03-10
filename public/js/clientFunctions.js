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
        messageClass = 'username';
    }
    else{
        messageClass = 'otherDudeUsername';
    }

    $('#messages').prepend((
        (($('<li>').append($('<div>')
            .text(name)
            .addClass(messageClass)
            .css('color', user.color)))
            .append($('<div>').text(msg).addClass('message')))
            .append($('<div>').text(time).addClass('timestamp'))
    ).addClass('normalMessage'));

    window.scrollTo(0, document.body.scrollHeight);
}


function populateMessages(messages){
    for (let i = 0; i < messages.length; i++){
        addMessage(messages[i]['user'], messages[i]['msg'], messages[i]['time']);
    }
}

function createAlertMessage(message){
    $('#messages').prepend(
        ($('<li>').append($('<div>')
            .text(message)
            .addClass('eventMessage')
    )));

    window.scrollTo(0, document.body.scrollHeight);
}

$(function () {
    let socket = io();
    $('form').submit(function(){
        socket.emit('chat message', $('#m').val());
        $('#m').val('');
        return false;
    });

    socket.on('throw cookies', function(cooks))

    socket.on('chat message', function(user, msg, time){
        addMessage(user, msg, time, '');
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

    socket.on('user disconnected', function(userName, users){
        flushUserList(users);
        createAlertMessage(userName + " has disconnected!");
    });


    socket.on('change color', function(name, nickColor){
        $('div.username:contains("' + name + '")').css("color",nickColor);
    });

    socket.on('change nick', function(oldName, newName){
        $('div.username:contains("' + oldName + '")').text(newName);
    });

    socket.on('name taken', function(time){
        addMessage({'user': 'Yammy', 'color':'"blue"'}, "That name is already taken, I'm sorry! D: ~Yammy", time);
    })

});