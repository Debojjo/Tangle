const mongoose = require('mongoose');

mongoose.connect(`mongodb://127.0.0.1:27017/minipro`);

const userSchema = mongoose.Schema({
    username: String,
    name: String,
    email: String,
    password: String,
    age: Number,
    profilepic: {
      type: String,  
      default: "download.png"
    },
    posts: [
        { type: mongoose.Schema.Types.ObjectId, ref: "post" }
    ]
});


module.exports = mongoose.model("user", userSchema);