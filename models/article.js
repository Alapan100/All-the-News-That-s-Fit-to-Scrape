var mongoose = require("mongoose");
var Note = require("./note");
// Creating a Schema class
var Schema = mongoose.Schema;

// Creating an article schema
var articleSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  summary: {
    type: String,
    required: true
  },
  link: {
    type: String,
    required: true
  },
  saved: {
    type: Boolean,
    default: false
  },
  notes: [{
     type: Schema.Types.ObjectId,
     ref: "Note"
  }]
});

// Create the article model with the articleSchema
var article = mongoose.model("article", articleSchema);

module.exports = article;
