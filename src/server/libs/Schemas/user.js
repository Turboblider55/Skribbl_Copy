const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username : {
        type : String,
        trim : true,
        required : true,
    },
    socketid : {
        type : String,
        required : true,
    },
    isPartyLeader : {
        type : Boolean,
        default : false,
    },
    guessedIt : {
        type: Boolean,
        default: false,
    },
    guessedIndex : {
        type : Number,
        default : -1
    },
    isDrawing : {
        type : Boolean, 
        default : false
    },
    points : {
        type : Number,
        default : 0,
    }
});
const usermodel = mongoose.model('User',userSchema); 
module.exports = {usermodel,userSchema};