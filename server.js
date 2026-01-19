const mongoose = require('mongoose');

// Use an Environment Variable for security
const mongoURI = process.env.MONGODB_URI;

mongoose.connect(mongoURI)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.log("MongoDB Error:", err));

// Create a "Schema" to save messages
const messageSchema = new mongoose.Schema({
  user: String,
  text: String,
  time: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);

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
    // NEW: Fetch messages from MongoDB
    try {
        // Find messages, sort by newest first, limit to 50
        const history = await Message.find().sort({ time: -1 }).limit(50);
        // Send them to the user (reversed so they are in chronological order)
        socket.emit("chat-history", history.reverse());
    } catch (err) {
        console.error("Error loading history:", err);
    }
    socket.emit("login-success", username);
    socket.broadcast.emit("system", `${username} joined the chat`);
  });
  const messageSchema = new mongoose.Schema({
  user: String,
  text: String,
  time: { type: Date, default: Date.now } // This saves the date and time
});

socket.on("message", async (msg) => { // Added 'async'
    const user = connectedUsers[socket.id];
    
    // 1. Create and Save the message to MongoDB
    const newMessage = new Message({ user, text: msg });
    await newMessage.save();

    // 2. Broadcast as you did before
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
const PORT = process.env.PORT || 1000;

http.listen(PORT, () => {
  console.log("Server running on port", PORT);
});





