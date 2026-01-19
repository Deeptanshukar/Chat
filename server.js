const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

const allowedUsers = ["alice", "bob"];
let connectedUsers = {};

app.use(express.static("public"));

io.on("connection", socket => {

  socket.on("login", username => {

    if (!allowedUsers.includes(username)) {
      socket.emit("login-failed", "Access denied");
      socket.disconnect();
      return;
    }

    if (Object.values(connectedUsers).includes(username)) {
      socket.emit("login-failed", "User already logged in");
      socket.disconnect();
      return;
    }

    connectedUsers[socket.id] = username;
    socket.emit("login-success", username);
    socket.broadcast.emit("system", `${username} joined the chat`);
  });

  socket.on("message", msg => {
    const user = connectedUsers[socket.id];
    socket.broadcast.emit("message", {
      user,
      text: msg
    });
  });

  socket.on("disconnect", () => {
    const user = connectedUsers[socket.id];
    delete connectedUsers[socket.id];
    if (user) {
      socket.broadcast.emit("system", `${user} left the chat`);
    }
  });
});

/* 👇 THIS PART WAS MISSING */
const PORT = process.env.PORT || 3000;

http.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
