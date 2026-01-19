const socket = io();
let currentUser = "";

// --- LOGIN LOGIC ---
function login() {
    const username = document.getElementById("username").value;
    socket.emit("login", username);
}

socket.on("login-success", username => {
    currentUser = username;
    document.getElementById("login").style.display = "none";
    document.getElementById("chat").style.display = "block";
});

socket.on("login-failed", msg => {
    alert(msg);
});

// --- MESSAGE DISPLAY LOGIC ---

// Helper function to add any message to the UI with a timestamp
function appendMessage(user, text, time) {
    // Make sure your HTML has an element with id="chat-box"
    const chatBox = document.getElementById("chat-box");
    const msgElement = document.createElement("div");
    msgElement.style.marginBottom = "10px";

    // Format the time (If no time is provided from DB, use the current time)
    const msgDate = time ? new Date(time) : new Date();
    const timeString = msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Use "You" if the message is from the current user
    const displayName = (user === currentUser) ? "You" : user;

    msgElement.innerHTML = `
        <span class="message-user"><b>${displayName}</b></span>
        <span class="message-text">: ${text}</span>
        <span class="message-time" style="font-size: 0.7em; color: gray; margin-left: 10px;">
            ${timeString}
        </span>
    `;

    chatBox.appendChild(msgElement);
    chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll to bottom
}

// --- SOCKET LISTENERS ---

// 1. Listen for the chat history from MongoDB when you first log in
socket.on("chat-history", (messages) => {
    messages.forEach(msg => {
        appendMessage(msg.user, msg.text, msg.time); 
    });
});

// 2. Listen for live incoming messages from others
socket.on("message", (data) => {
    appendMessage(data.user, data.text, data.time || new Date());
});

// 3. Listen for system messages (joins/leaves)
socket.on("system", msg => {
    const chatBox = document.getElementById("chat-box");
    chatBox.innerHTML += `<p style="color:gray; font-style: italic;">${msg}</p>`;
    chatBox.scrollTop = chatBox.scrollHeight;
});

// --- SENDING LOGIC ---
function sendMessage() {
    const input = document.getElementById("message");
    if (input.value.trim() === "") return; // Don't send empty messages

    // Send to server
    socket.emit("message", input.value);
    
    // Add to our own screen immediately
    appendMessage(currentUser, input.value, new Date());
    
    input.value = "";
}
