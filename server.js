const mongoose = require('mongoose');
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

// 1. Database Connection
const mongoURI = process.env.MONGODB_URI;

mongoose.connect(mongoURI)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.log("MongoDB Error:", err));

// 2. Message Schema
const messageSchema = new mongoose.Schema({
  user: String,
  text: String,
  time: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);

// 3. App Settings
const allowedUsers = ["alice", "bob"];
let connectedUsers = {};

app.use(express.static("public"));

// 4. Socket Logic
io.on("connection", socket => {

  // LOGIN HANDLER - Added 'async' to allow 'await Message.find()'
  socket.on("login", async (username) => {
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

    // Fetch history from MongoDB
    try {
        const history = await Message.find().sort({ time: -1 }).limit(50);
        socket.emit("chat-history", history.reverse());
    } catch (err) {
        console.error("Error loading history:", err);
    }

    socket.emit("login-success", username);
    socket.broadcast.emit("system", `${username} joined the chat`);
  });

  // MESSAGE HANDLER
  socket.on("message", async (msg) => {
    const user = connectedUsers[socket.id];
    if (!user) return;

    try {
        const newMessage = new Message({ user, text: msg });
        await newMessage.save();

        // Broadcast to all other users with the timestamp
        socket.broadcast.emit("message", {
            user,
            text: msg,
            time: newMessage.time
        });
    } catch (err) {
        console.error("Save error:", err);
    }
  });

  // DISCONNECT HANDLER
  socket.on("disconnect", () => {
    const user = connectedUsers[socket.id];
    delete connectedUsers[socket.id];
    if (user) {
      socket.broadcast.emit("system", `${user} left the chat`);
    }
  });
});

// 5. Start Server
const PORT = process.env.PORT || 10000; // Render uses 10000 by default
http.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
