const mongoose = require("mongoose");

const ImageSchema = new mongoose.Schema({
  name: String,
  image: Buffer,
});

const imageDetails = mongoose.model("imageDetails", ImageSchema);

module.exports = imageDetails;
