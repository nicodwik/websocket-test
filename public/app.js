// var socket = io("wss://boiling-citadel-46181.herokuapp.com");
var socket = io("");

var userlist = document.getElementById("active_users_list");
var roomlist = document.getElementById("active_rooms_list");
var message = document.getElementById("messageInput");
var sendMessageBtn = document.getElementById("send_message_btn");
var roomInput = document.getElementById("roomInput");
var createRoomBtn = document.getElementById("room_add_icon_holder");
var chatDisplay = document.getElementById("chat");

var currentRoom = {
    id : 'global', // wajib, id room
    name : 'Global', // wajib, nama room
    avatar : '', // optional, sesuaikan kebutuhan UI (nama object FE & Mobile harus sama dan ada, agar tdk undifined variable)
    type : '', // optional, sesuaikan kebutuhan UI (nama object FE & Mobile harus sama dan ada, agar tdk undifined variable)
    isGroup : false , // optional, sesuaikan kebutuhan UI (nama object FE & Mobile harus sama dan ada, agar tdk undifined variable)
};

var user = {
    token : "", // optional, hanya untuk send JWT auth ke API
    name : "", // wajib
    id : "", // wajib
    avatar : "", // optional, sesuaikan kebutuhan UI (nama object FE & Mobile harus sama dan ada, agar tdk undifined variable)
};
let rooms = []; //hanya untuk penampung list room
let targets = []; //hanya untuk penampung list UUID person yang dikirim notifnya
const api = 'https://dev-api.ggl.life';
// const api = 'http://api.ggl';

email = prompt("Email");
password = prompt("password");
login(email, password);

//on connecting to server
socket.on("connect", function () {
    console.log("Connect to socket");
});

// Send message on button click
sendMessageBtn.addEventListener("click", function () {
    data = {
        message : message.value, // wajib, untuk data pesan
        opposites : targets, // wajib, untuk target user yang dikirim notifikasi pesan masuk
        // ambil dari list members di room yg bersangkutam
        person : {
            id : user.id,
            name : user.name,
            avatar : user.avatar,
        }, // optional, sesuaikan kebutuhan UI (nama object FE & Mobile harus sama dan ada, agar tdk undifined variable)
        type : 'text', // optional, sesuaikan kebutuhan UI (nama object FE & Mobile harus sama dan ada, agar tdk undifined variable)
        room : currentRoom, // optional, sesuaikan kebutuhan UI (nama object FE & Mobile harus sama dan ada, agar tdk undifined variable)
        parent : {
            id : '',
            message : '',
            type : '',
            person : {
                id : '',
                name : '',
                avatar : '',
            }
        } // optional, sesuaikan kebutuhan UI (nama object FE & Mobile harus sama dan ada, agar tdk undifined variable)
    }
    socket.emit("sendMessage", JSON.stringify(data)); // socket
    createMessage(message.value); // lumen
    message.value = "";
});

// Send message on enter key press
message.addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
        sendMessageBtn.click();
    }
});

// jika ada pesan baru
socket.on("updateChat", function (event, data) {
    data = JSON.parse(data);
    console.log(data);
    if (event === "INFO") {
        console.log("Displaying announcement");
        chatDisplay.innerHTML += `<div class="announcement"><span>${data.message}</span></div>`;
    } else if(event === "NEW") {
        className = data.person.id === user.id ? "me" : "";
        chatDisplay.innerHTML += `<div class="message_holder ${className}">
                                    <div class="pic"></div>
                                    <div class="message_box">
                                    <div id="message" class="message">
                                        <span class="message_name">${data.person.name}</span>
                                        <span class="message_text">${data.message}</span>
                                    </div>
                                    </div>
                                </div>`;
    }

    chatDisplay.scrollTop = chatDisplay.scrollHeight;
});

// jika ada error di server
socket.on("onError", function (event, data) {
    console.log(data);
    data = JSON.parse(data);
    $('.toast strong').html(`WebSocket Server Error`);
    $('.toast .toast-body').html(data.message);
    $('.toast').toast('show');
});

// ada event notif dari server
socket.on(`getNotif`, function (event, data) {
    data = JSON.parse(data);
    if (data.room.isGroup) {
        $('.toast strong').html(`Pesan baru dari ${data.room.name}`);
        $('.toast .toast-body').html(`${data.person.name} : ${data.message}`);
    }else{
        $('.toast strong').html(`Pesan baru dari ${data.person.name}`);
        $('.toast .toast-body').html(data.message);
    }
    $('.toast').toast('show');
});

//list users connected in server
socket.on("updateUsers", function (users) {
    userlist.innerHTML = "";
    console.log("user returned from server", users);
    for (var user in users) {
        userlist.innerHTML += `<div class="user_card">
                                <div class="pic"></div>
                                <span>${users[user].name}</span>
                                </div>`;
    }
});


socket.on("connect_error", () => {
    setTimeout(() => {
        socket.connect();
    }, 1000);
});

socket.on("disconnect", (reason) => {
    $('.toast strong').html(`WebSocket Disconnected`);
    $('.toast .toast-body').html(reason);
    $('.toast').toast('show');
});

function changeRoom(element) {
    data = {
        id : $(element).data('id'),
        name : $(element).data('name'),
        avatar : $(element).data('avatar'),
        type : $(element).data('type'),
        isGroup : $(element).data('isgroup'),
    }
    if (data.id != currentRoom.id) {
        socket.emit("updateRooms", data);
        currentRoom = data;
        chatDisplay.innerHTML = "";
        listMessage();
        rooms.forEach( element => {
            if (element.id == data.id) {
                console.log(element);
                targets = element.members.map( e => e.id);
            }
        });
    }
}


function listRoom(){
    //get list room by JWT
    var myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${user.token}`);
    var requestOptions = {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow'
    };

    fetch(`${api}/v1/chatting/list-room`, requestOptions)
        .then(response => response.json())
        .then(result => {
        roomlist.innerHTML = "";
        rooms = result.msgServer.data;
        rooms.forEach(element => {
            last_message = element.last_message ? `${element.last_message.person.name} : ${element.last_message.message}` : '';
            roomlist.innerHTML += `<div class="room_card" id="${element.id}"
                                        onclick="changeRoom(this)"
                                        data-id="${element.id}"
                                        data-name="${element.name}"
                                        data-avatar="${element.avatar}"
                                        data-type="${element.type}"
                                        data-isGroup="${element.is_group}"
                                        >
                                        <div class="room_item_content">
                                            <div class="pic"></div>
                                            <div class="roomInfo">
                                            <span class="room_name">#${element.name}</span>
                                            <span class="room_author">${last_message}</span>
                                            </div>
                                        </div>
                                    </div>`;
        });

        })
        .catch(error => console.log('error', error));

}

function createMessage(message){
    var myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${user.token}`);
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

    var urlencoded = new URLSearchParams();
    urlencoded.append("status", "created");
    urlencoded.append("room", currentRoom.id);
    urlencoded.append("message", message);

    var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: urlencoded,
        redirect: 'follow'
    };

    fetch(`${api}/v1/chatting/create-message`, requestOptions)
        .then(response => response.text())
        .then(result => console.log(result))
        .catch(error => console.log('error', error));
}

function listMessage(){
    var myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${user.token}`);
    var requestOptions = {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow'
    };

    fetch(`${api}/v1/chatting/list-message?room=`+ currentRoom.id, requestOptions)
    .then(response => response.json())
    .then(result => {
        result = result.msgServer.data;
        for (var r in result) {
          element = result[r];
          chatDisplay.innerHTML += `<div class="message_holder ${element.person.id === user.id ? "me" : ""}">
                                    <div class="pic"></div>
                                    <div class="message_box">
                                      <div id="message" class="message">
                                        <span class="message_name">${element.person.name}</span>
                                        <span class="message_text">${element.message}</span>
                                      </div>
                                    </div>
                                  </div>`;
        }
        chatDisplay.scrollTop = chatDisplay.scrollHeight;
    })
    .catch(error => console.log('error', error));
}

function login(email, password){
    var formdata = new FormData();
    formdata.append("username", email);
    formdata.append("password", password);

    var requestOptions = {
        method: 'POST',
        body: formdata,
        redirect: 'follow'
    };

    fetch(`${api}/v1/auth/login`, requestOptions)
        .then(response => response.json())
        .then(result => {
        user = {
            token : result.msgServer.access_token,
            name : result.msgServer.user.person.name,
            id : result.msgServer.user.person.id,
            avatar : result.msgServer.user.person.avatar,
        };
        $("#user-ku").html(user.name);
        socket.emit("createUser", JSON.stringify({id : user.id, name : user.name})); //connect to web socket
        listRoom();
        })
        .catch(error => console.log('error', error));
}
