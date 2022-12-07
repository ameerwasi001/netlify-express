const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const termSchema = new Schema({
    type: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        required: true,
    }
});

const Term = mongoose.model("term", termSchema);

module.exports = Term;