const socket = io();
let currentUser = "";

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

socket.on("message", data => {
  document.getElementById("chat-box").innerHTML +=
    `<p><b>${data.user}:</b> ${data.text}</p>`;
});

socket.on("system", msg => {
  document.getElementById("chat-box").innerHTML +=
    `<p style="color:gray">${msg}</p>`;
});

function sendMessage() {
  const input = document.getElementById("message");
  socket.emit("message", input.value);
  document.getElementById("chat-box").innerHTML +=
    `<p><b>You:</b> ${input.value}</p>`;
  input.value = "";
}
socket.on("history", messages => {
  const chatBox = document.getElementById("chat-box");

  messages.forEach(m => {
    chatBox.innerHTML += `<p><b>${m.user}:</b> ${m.text}</p>`;
  });

  chatBox.scrollTop = chatBox.scrollHeight;
});
// Function to add a message to the UI
function appendMessage(user, text, time) {
    const messagesDiv = document.getElementById("messages");
    const msgElement = document.createElement("div");
    msgElement.classList.add("message-container");

    // Format the time (If no time is provided, use the current time)
    const msgDate = time ? new Date(time) : new Date();
    const timeString = msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    msgElement.innerHTML = `
        <span class="message-user"><b>${user}</b></span>
        <span class="message-text">${text}</span>
        <span class="message-time" style="font-size: 0.7em; color: gray; margin-left: 10px;">
            ${timeString}
        </span>
    `;

    messagesDiv.appendChild(msgElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Update the history listener to pass the saved time
socket.on("chat-history", (messages) => {
    messages.forEach(msg => {
        appendMessage(msg.user, msg.text, msg.time); 
    });
});

// Update the live message listener
socket.on("message", (data) => {
    appendMessage(data.user, data.text, new Date());
});

