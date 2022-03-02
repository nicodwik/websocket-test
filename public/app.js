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
    id : 'global',
    name : 'Global',
    avatar : '',
    type : '',
    isGroup : false ,
};

var user = {
  token : "",
  name : "",
  id : "",
  avatar : "",
};
let rooms = [];
let targets = [];
// let api = 'https://dev-api.ggl.life';
let api = 'http://api.ggl';

email = prompt("Email");
password = prompt("password");
login(email, password);
// Prompt for username on connecting to server
socket.on("connect", function () {
  console.log("Connect to socket");
});

// Send message on button click
sendMessageBtn.addEventListener("click", function () {
  data = {
      from : {
          id : user.id,
          name : user.name,
          avatar : user.avatar,
      },
      room : currentRoom,
      message : message.value,
      type : 'string',
      opposites : targets
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

// Create new room on button click
createRoomBtn.addEventListener("click", function () {
  // socket.emit("createRoom", prompt("Enter new room: "));
  let roomName = roomInput.value.trim();
  if (roomName !== "") {
    socket.emit("createRoom", roomName);
    roomInput.value = "";
  }
});

socket.on("updateChat", function (userevent, data) {
  if (userevent === "INFO") {
    console.log("Displaying announcement");
    chatDisplay.innerHTML += `<div class="announcement"><span>${data}</span></div>`;
  } else {
    console.log("Displaying user message");
    chatDisplay.innerHTML += `<div class="message_holder ${
      userevent.id === user.id ? "me" : ""
    }">
                                <div class="pic"></div>
                                <div class="message_box">
                                  <div id="message" class="message">
                                    <span class="message_name">${userevent.name}</span>
                                    <span class="message_text">${data}</span>
                                  </div>
                                </div>
                              </div>`;
  }

  chatDisplay.scrollTop = chatDisplay.scrollHeight;
});

socket.on(`getNotif`, function (userevent, data) {
    data = JSON.parse(data);
    if (data.room.isGroup) {
        $('.toast strong').html(`Pesan baru dari ${data.room.name}`);
        $('.toast .toast-body').html(`${data.from.name} : ${data.message}`);
    }else{
        $('.toast strong').html(`Pesan baru dari ${data.from.name}`);
        $('.toast .toast-body').html(data.message);
    }
    $('.toast').toast('show');
});

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
  console.log(reason);
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
                                        <span class="room_author">${element.last_message.person.name} : ${element.last_message.message}</span>
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
