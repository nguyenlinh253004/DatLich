const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  Description: { type: String,  },
  image: { type: String },
  price: { type: String,required: true},
},{ timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);