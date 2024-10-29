require("dotenv").config();

const express = require("express");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const { isValidObjectId } = require("mongoose");
const { availableParallelism } = require("node:os");
const cluster = require("node:cluster");
const { createAdapter, setupPrimary } = require("@socket.io/cluster-adapter");

const connectDB = require("./db/connect");
const Message = require("./models/Message");

if (cluster.isPrimary) {
  const numCPUs = availableParallelism();

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork({
      PORT: 5000 + i,
    });
  }

  return setupPrimary();
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  connectionStateRecovery: {},
  adapter: createAdapter(),
});

app.use(express.static(path.join(__dirname, "client")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "client/index.html"));
});

// basic setup with disconnect

// io.on("connection", (socket) => {
//   console.log("a user connected");
//   socket.on("disconnect", () => {
//     console.log("a user is disconnected");
//   });
// });

io.on("connection", async (socket) => {
  // socket.on("disconnect", () => {
  //   console.log("a user disconnected");
  // });

  socket.on("chat message", async (msg, clientOffset, callback) => {
    let result;

    try {
      result = await Message.findOne({ clientOffset });
      console.log("clientOffset:", clientOffset);
      if (!result) {
        result = new Message({ content: msg, clientOffset });
        console.log(result.content);
        await result.save();
      } else {
        callback();
        return;
      }

      // console.log(result._id, result.content);
    } catch (e) {
      console.error("Failed to store message", e);
      return;
    }
    io.emit("hi", msg, result._id);

    callback();
  });

  if (!socket.recovered) {
    try {
      const serverOffset = socket.handshake.auth.serverOffset;
      console.log("serverOffset", serverOffset);
      let query = {};

      if (serverOffset && isValidObjectId(serverOffset)) {
        query = { _id: { $gt: serverOffset } };
      } else {
        console.warn("inValid serverOffset, skipping message recovery");
      }

      const messages = await Message.find(query).sort({
        _id: 1,
      });

      // console.log(messages);
      messages.forEach((message) => {
        socket.emit("hi", message.content, message._id);
      });
    } catch (e) {
      console.error("Failed to recover messages", e);
    }
  }

  // socket.on("request1", (arr1, callback) => {
  //   console.log(arr1);
  //   callback({ status: "ok" });
  // });

  // socket.timeout(5000).emit("request", { name: "surya" }, (err, res) => {
  //   if (err) {
  //     console.log(err);
  //   } else {
  //     console.log(res);
  //   }
  // });
});

// const process = require("node:process");

// console.log("parallelism", os.homedir());

const port = process.env.PORT || 3000;

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);

    server.listen(port, () => {
      console.log(`Server is listening on Port ${port}`);
    });
  } catch (error) {
    console.log(error);
  }
};

start();
