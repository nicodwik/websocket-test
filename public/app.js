var socket = io();

var userlist = document.getElementById("active_users_list");
var roomlist = document.getElementById("active_rooms_list");
var message = document.getElementById("messageInput");
var sendMessageBtn = document.getElementById("send_message_btn");
var roomInput = document.getElementById("roomInput");
var createRoomBtn = document.getElementById("room_add_icon_holder");
var chatDisplay = document.getElementById("chat");

var currentRoom = "global";
var user = {
  token : "",
  name : "",
  id : "",
  avatar : "",
};
let rooms = [];
let api = 'https://dev-api.ggl.life';

email = prompt("Email");
password = prompt("password");
login(email, password);
// Prompt for username on connecting to server
socket.on("connect", function () {
  console.log("Connect to socket");
});

// Send message on button click
sendMessageBtn.addEventListener("click", function () {
  socket.emit("sendMessage", message.value); // socket
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

// socket.on("updateRooms", function (rooms, newRoom) {
//   roomlist.innerHTML = "";

//   for (var index in rooms) {
//     roomlist.innerHTML += `<div class="room_card" id="${rooms[index].name}"
//                                 onclick="changeRoom('${rooms[index].name}')">
//                                 <div class="room_item_content">
//                                     <div class="pic"></div>
//                                     <div class="roomInfo">
//                                     <span class="room_name">#${rooms[index].name}</span>
//                                     <span class="room_author">${rooms[index].creator}</span>
//                                     </div>
//                                 </div>
//                             </div>`;
//   }

//   document.getElementById(currentRoom).classList.add("active_item");
// });

function changeRoom(element) {
  data = {
    id : $(element).data('id'),
    name : $(element).data('name'),
    avatar : $(element).data('avatar'),
    type : $(element).data('type'),
  }
  if (data.id != currentRoom) {
    socket.emit("updateRooms", data);
    // document.getElementById(currentRoom).classList.remove("active_item");
    currentRoom = data.id;
    // document.getElementById(currentRoom).classList.add("active_item");
    chatDisplay.innerHTML = "";
    listMessage();
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
                                    >
                                    <div class="room_item_content">
                                        <div class="pic"></div>
                                        <div class="roomInfo">
                                        <span class="room_name">#${element.name}</span>
                                        <span class="room_author">${element.is_group ? 'group' : 'chat'} - ${element.type}</span>
                                        </div>
                                    </div>
                                </div>`;
      });

    })
    .catch(error => console.log('error', error));

  // document.getElementById(currentRoom).classList.add("active_item");
}

function createMessage(message){
  var myHeaders = new Headers();
  myHeaders.append("Authorization", `Bearer ${user.token}`);
  myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

  var urlencoded = new URLSearchParams();
  urlencoded.append("status", "created");
  urlencoded.append("room", currentRoom);
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

    fetch(`${api}/v1/chatting/list-message?room=`+ currentRoom, requestOptions)
    .then(response => response.json())
    .then(result => {
        result = result.msgServer.data;
        for (var r in result) {
          element = result[r];
          console.log(element);
          console.log(user.id);
          chatDisplay.innerHTML += `<div class="message_holder ${element.member === user.id ? "me" : ""}">
                                    <div class="pic"></div>
                                    <div class="message_box">
                                      <div id="message" class="message">
                                        <span class="message_name">${element.name}</span>
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