import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
    {
        members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        lastMessage: {
            text: String,
            sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            createdAt: Date
        },  
    },
    { timestamps: true }
);

export default mongoose.model("Conversation", conversationSchema);