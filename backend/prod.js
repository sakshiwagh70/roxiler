const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String, required: true },
  sold:{type:Boolean},
  dateOfSale: { type: Date, required: true },
});

const prod = mongoose.model("prod", itemSchema);

module.exports = prod;