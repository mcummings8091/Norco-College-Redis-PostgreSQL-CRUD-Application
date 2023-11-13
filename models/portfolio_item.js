const mongoose = require("mongoose");

const ItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  skills: {
    type: [String],
    required: true,
  },
});

const Item = mongoose.model("Item", ItemSchema);
module.exports = Item;
