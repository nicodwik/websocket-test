const express = require("express");
const http = require("http");

const app = express();
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: "*",
    // allowedHeaders: ["my-custom-header"],
    // credentials: true
  }
});
const port = process.env.PORT || 5000

app.use(express.static("public"));

// Global variables to hold all users and rooms created
var users = {};
var rooms = [
  { name: "global", creator: "Anonymous" },
];

io.on("connection", function (socket) {
  console.log(`User connected to server.`);

  socket.on("createUser", function (user) {
    user = JSON.parse(user);
    socket.currentUser = user;
    users[user.id] = user;
    socket.currentRoom = "global";
    socket.join("global");

    console.log(`User ${user.name} created on server successfully.`);

    socket.emit("updateChat", "INFO", "You have joined global room");
    socket.broadcast
      .to("global")
      .emit("updateChat", "INFO", user.name + " has joined global room");
    io.sockets.emit("updateUsers", users);
    socket.emit("updateRooms", rooms, "global");
  });

  socket.on("sendMessage", function (data) {
    io.sockets.to(socket.currentRoom).emit("updateChat", socket.currentUser, data);
  });

  // socket.on("createRoom", function (room) {
  //   if (room != null) {
  //     rooms.push({ name: room, creator: socket.currentUser.name });
  //     io.sockets.emit("updateRooms", rooms, null);
  //   }
  // });

  socket.on("updateRooms", function (room) {
    socket.broadcast
      .to(socket.currentRoom)
      .emit("updateChat", "INFO", socket.currentUser.name + " left room");
    socket.leave(socket.currentRoom);
    socket.currentRoom = room.id;
    socket.join(room.id);
    socket.emit("updateChat", "INFO", "You have joined " + room.name + " room");
    socket.broadcast
      .to(room.id)
      .emit(
        "updateChat",
        "INFO",
        socket.currentUser.name + " has joined this room"
      );
  });

  socket.on("disconnect", function () {
    if (!socket.currentRoom) {
      console.log(`User not detected disconnected from server.`);
      return false
    };
    console.log(`User ${socket.currentUser.name} disconnected from server.`);
    delete users[socket.currentUser.id]
    io.sockets.emit("updateUsers", users);
    socket.broadcast.emit(
      "updateChat",
      "INFO",
      socket.currentUser.name + " has disconnected"
    );
  });
});
server.listen(port, function () {
  console.log("Listening to port " + port);
});
