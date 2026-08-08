import mongoose from "mongoose";

const messageSchema=new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: {type:String},
    isFile:{type:Boolean, default:false},
    filePath: {type: String},
    createdAt: Date,
})
export default mongoose.model("Message", messageSchema);