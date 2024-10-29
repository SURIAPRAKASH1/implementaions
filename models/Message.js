const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  content: String,
  clientOffset: String,
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Message", messageSchema);
