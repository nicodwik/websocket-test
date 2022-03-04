const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const { Server } = require("socket.io");
const cors = {
    origin: "*",
    methods: "*",
    // allowedHeaders: ["my-custom-header"],
    // credentials: true
  }
const io = new Server(server, { cors: cors });
const port = process.env.PORT || 5000
app.use(express.static("public"));

// Global variables to hold all users and rooms created
let users = {};
// let rooms = [ { name: "global", creator: "Anonymous" } ];

io.on("connection", function (socket) {
    socket.on("createUser", function (user) {
        try {
            user = JSON.parse(user);
            user['socketId'] = socket.id;
            socket.currentUser = user;
            users[user.id] = user;
            socket.currentRoom = "global";
            socket.join("global");
            console.log(`User ${user.name} created on server successfully.`);
            socket.emit("updateChat", "INFO", JSON.stringify({ message : "You have joined global room" }));
            socket.broadcast.to("global").emit("updateChat", 'INFO' , JSON.stringify({ message : `${user.name} has joined global room` }));
            io.sockets.emit("updateUsers", users);
            // socket.emit("updateRooms", rooms, "global");
        }catch (error) {
            console.log(error);
            socket.emit("onError", "INFO", JSON.stringify({ message : error.message }));
        }
    });

    socket.on("sendMessage", function (data) {
        if (!socket.currentUser)return false;
        try {
            io.sockets.to(socket.currentRoom).emit("updateChat", "NEW", data);
            dataDecode = JSON.parse(data);
            targets = dataDecode.opposites;
            targets.forEach(element => {
                target = users[element];
                if (target != undefined) {
                    if (target.socketId != socket.id ){
                        io.to(target.socketId).emit("getNotif", "INFO", data);
                    }
                }
            });
        } catch (error) {
            console.log(error);
            socket.emit("onError", "INFO", JSON.stringify({ message : error.message }));
        }
    });

    socket.on("updateRooms", function (room) {
        if (!socket.currentUser) return false;
        try {
            socket.broadcast.to(socket.currentRoom).emit("updateChat", "INFO", JSON.stringify({ message : `${socket.currentUser.name} left room` }));
            socket.leave(socket.currentRoom);
            socket.currentRoom = room.id;
            socket.join(room.id);
            socket.emit("updateChat", "INFO", JSON.stringify({ message : `You have joined ${room.name} room` }));
            socket.broadcast.to(room.id).emit("updateChat", "INFO", JSON.stringify({ message : `${socket.currentUser.name} has joined this room`}));
        } catch (error) {
            console.log(error);
            socket.emit("onError", "INFO", JSON.stringify({ message : error.message }));
        }
    });

    socket.on("disconnect", function () {
        if (!socket.currentUser) return false;
        try {
            io.sockets.emit("updateUsers", users);
            socket.broadcast.emit( "updateChat","INFO", JSON.stringify({ message : `${socket.currentUser.name} has disconnected` }));
            delete users[socket.currentUser.id];
            console.log(`User ${socket.currentUser.name} disconnected.`);
        }catch (error) {
            console.log(error);
            socket.emit("onError", "INFO", JSON.stringify({ message : error.message }));
        }
    });
});

server.listen(port, () => console.log("Listening to port " + port));
