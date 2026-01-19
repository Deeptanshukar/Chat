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

