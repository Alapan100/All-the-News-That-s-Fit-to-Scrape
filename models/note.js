var mongoose = require("mongoose");
// Creating a schema class
var Schema = mongoose.Schema;

// Creating note schema
var noteSchema = new Schema({
    body: {
        type: String
    },
    article: {
        type: Schema.Types.ObjectId,
        ref: "article"
    }
});

// Creating the Note model with the noteSchema
var Note = mongoose.model("Note", noteSchema);

module.exports = Note;