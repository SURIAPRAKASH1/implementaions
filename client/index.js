const socket = io({
  auth: {
    serverOffset: null,
  },
  ackTimeout: 10000,
  retries: 3,
});

const form = document.getElementById("form");
const input = document.getElementById("input");
const messages = document.getElementById("messages");
const toggleButton = document.getElementById("toggle-btn");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  if (input.value) {
    const clientOffset = `${socket.id}-${Date.now()}`;
    socket.emit("chat message", input.value, clientOffset, () => {
      console.log("message sent acknowladege by server");
    });
    input.value = "";
  }
});

toggleButton.addEventListener("click", (e) => {
  e.preventDefault();

  if (socket.connected) {
    toggleButton.innerHTML = "Connect";
    socket.disconnect();
  } else {
    toggleButton.innerHTML = "Disconnect";
    socket.connect();
  }
});

socket.on("hi", (msg, serverOffset) => {
  const item = document.createElement("li");
  item.textContent = msg;
  messages.appendChild(item);
  window.scrollTo(0, document.body.scrollHeight);
  socket.auth.serverOffset = serverOffset;

  // localStorage.setItem("server", serverOffset);
});

// socket.on("reconnect", () => {
//   socket.auth.serverOffset = localStorage.getItem("server") || null;

//   socket.io.opts.auth = { serverOffset: socket.auth.serverOffset };
//   socket.connect();
// });

// call back known as acknowledge in web socket

// socket.timeout(5000).emit("request1", { name: "luffy" }, (err, res) => {
//   if (err) {
//     console.log(err);
//   } else {
//     console.log(res);
//   }
// });

// socket.on("request", (arr1, callback) => {
//   console.log(arr1);
//   callback({ status: "ok" });
// });
