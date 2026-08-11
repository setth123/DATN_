import mongoose from "mongoose";
import Message from "../models/Message.model.js";
import Conversation from "../models/Conversation.model.js";
import { getIo } from "./socket.service.js";
import { runGemini } from "./gemini.service.js";
import {
  getConversation,
  updateConversation,
} from "../infrastructure/redis/conversationRepository.js";
import { createNotification } from "./notification.service.js";
import User from "../models/User.model.js";
import { getOrCreatAIConversation } from "./conversation.service.js";
import { deleteFile } from "./file.service.js";
import { maybeSummarize, getPDFContext, getDOCXContext } from "../utils/buildPrompt.js";

export const getMessages=async(conversationId,limit,before,isAI)=>{
    if(!conversationId)throw new Error("Conversation ID is required");
    const query={conversationId};
    if(before)query.createAt={$lt:new Date(before)};
    let messages;
    var flag = isAI==="true" ? true :false;
    if(flag){
        messages=await getConversation(conversationId);
        if(!messages || !messages.messages)throw new Error("Conversation not found or expired");
        // Chuyển đổi từ { role, parts } sang định dạng mà frontend mong đợi
        messages = messages.messages.map(m => {
            if (m.role === 'user' && m.isFile && m.fileName) {
                return {
                    _id: `ai-msg-${Math.random()}`,
                    role: m.role,
                    content: `Đã gửi tệp: ${m.fileName}`,
                    sender: { name: "You" },
                    createdAt: new Date().toISOString(),
                };
            }
            // Tin nhắn bình thường
            return {
                _id: `ai-msg-${Math.random()}`,
                role: m.role,
                content: m.parts.map(p => p.text).join(''),
                sender: { name: m.role === "user" ? "You" : "AI Assistant" },
                createdAt: new Date().toISOString(),
            };
        });
    }
    else{
        messages=await Message.find(query)
            .populate('sender', 'name')
            .sort({createdAt:-1})
            .limit(limit||50);
    }

    return messages;
}

export const sendMessage=async(userId,conversationId,text)=>{
    const io = getIo(); // Get io instance
    if(!userId||!text||!conversationId)throw new Error("Invalid payload");
    const newMessage=await Message.create({
        _id: new mongoose.Types.ObjectId(),
        conversationId,
        sender:userId,
        text
    });
    console.log("New message created:", newMessage);
    const conversation = await Conversation.findByIdAndUpdate(conversationId,{
        lastMessage:{
            text,
            sender:userId,
            createdAt:newMessage.createdAt
        }
    });

    // Populate sender information before emitting
    const populatedMessage = await Message.findById(newMessage._id).populate('sender', 'name');
    // Emit the new message to all clients in the conversation room
    if (io) {
        io.to(conversationId).emit('new_message', populatedMessage);
    }

    // Create notification for the recipient
    const recipientId = conversation.members.find(p => p.toString() !== userId);
    if (recipientId) {
        const senderUser = await User.findById(userId); // Fetch sender user to get email
        const newNotification = await createNotification({
            to: recipientId,
            from: userId,
            fromModel: 'User',
            type: 'NEW_MESSAGE',
            displayName: senderUser.email.split('@')[0], // New field: sender's email part
            conversationId: conversationId, // New field: conversation ID
        });
        if(io){
            io.to(recipientId.toString()).emit('new_notification', newNotification);
        }
    }
    return populatedMessage;
}

export const sendFile=async(userId, conversationId, file, isAI)=>{
    if (isAI) {
        const io = getIo();
        const onChunk = (chunk) => {
            // Client đã tham gia vào phòng có ID là conversationId, nên ta có thể emit tới phòng đó.
            io.to(conversationId).emit("ai_chunk", { conversationId, chunk });
        };

        // Đây là một lệnh gọi "fire-and-forget" từ góc độ của HTTP request.
        // Quá trình xử lý diễn ra ngầm và stream kết quả qua socket.
        handleAIFileMessage({ userId, conversationId, file, onChunk });

        // Controller có thể dùng thông báo này để gửi phản hồi về cho client.
        return { message: "AI processing of the file has started." };
    }

    const io = getIo(); // Get io instance
    if(!file||!conversationId)throw new Error("Invalid payload");

    const newMessage=await Message.create({
        _id: new mongoose.Types.ObjectId(),
        conversationId,
        sender:userId,
        text: file.originalname,
        isFile: true,
        filePath: file.path,
    });
    const conversation = await Conversation.findByIdAndUpdate(conversationId,{
        lastMessage:{
            text: file.originalname,
            sender:userId,
            createdAt:newMessage.createdAt
        }
    });

    // Populate sender information before emitting
    const populatedMessage = await Message.findById(newMessage._id).populate('sender', 'name');

    // Emit the new message to all clients in the conversation room
    if (io) {
        io.to(conversationId).emit('new_message', populatedMessage);
    }

    // Create notification for the recipient
    const recipientId = conversation.members.find(p => p.toString() !== userId);
    if (recipientId) {
        const senderUser = await User.findById(userId); // Fetch sender user to get email
        const newNotification = await createNotification({
            to: recipientId,
            from: userId,
            fromModel: 'User',
            type: 'NEW_MESSAGE',
            displayName: senderUser.email.split('@')[0], // New field: sender's email part
            conversationId: conversationId, // New field: conversation ID
        });
        if(io){
            io.to(recipientId.toString()).emit('new_notification', newNotification);
        }
    }

    return populatedMessage;
}

const MAX_MESSAGES_IN_MEMORY = 50;

export const handleAIMessage=async({ userId, conversationId, text, systemInstruction, onChunk, fileInfo = null })=>{
    // 1. Lấy hoặc tạo cuộc trò chuyện và ID của nó. ID cuộc trò chuyện AI chính là userId.
    const { convoId } = await getOrCreatAIConversation(userId, systemInstruction);
    const conversation = await getConversation(convoId);

    if (!conversation) {
        // Trường hợp này không nên xảy ra nếu getOrCreatAIConversation hoạt động đúng.
        // Tuy nhiên, đây là một biện pháp bảo vệ.
        throw new Error("Không tìm thấy cuộc trò chuyện AI hoặc đã hết hạn.");
    }
    
    // 2. Thêm tin nhắn hiện tại của người dùng vào lịch sử
    const userMessage = {
        role: "user",
        parts: [{ text }],
    };
    if (fileInfo) {
        userMessage.isFile = fileInfo.isFile;
        userMessage.fileName = fileInfo.fileName;
    }
    conversation.messages.push(userMessage);

    // 3. Tóm tắt cuộc trò chuyện nếu nó quá dài
    await maybeSummarize(conversation);

    // 4. Giới hạn ngữ cảnh trong MAX_MESSAGES_IN_MEMORY tin nhắn cuối để quản lý token
    let conversation_context;
    if (conversation.messages.length > MAX_MESSAGES_IN_MEMORY) {
        conversation_context = conversation.messages.slice(-MAX_MESSAGES_IN_MEMORY);
    } else {
        conversation_context = conversation.messages;
    }

    // 5. Gọi dịch vụ Gemini để nhận phản hồi từ AI
    const assistantReply = await runGemini(
        conversation_context,
        onChunk,
        userId,
        conversation.systemInstruction
    );

    // 6. Thêm phản hồi đầy đủ của AI vào lịch sử
    conversation.messages.push({
        role: "model", // Sử dụng role 'model' cho trợ lý AI
        parts: [{ text: assistantReply || "" }],
    });

    // 7. Giữ cho lịch sử trò chuyện trong Redis không tăng vô hạn
    if (conversation.messages.length > MAX_MESSAGES_IN_MEMORY) {
        const messagesToKeep = conversation.messages.slice(-MAX_MESSAGES_IN_MEMORY);
        conversation.messages = messagesToKeep;
    }

    // 8. Cập nhật lại cuộc trò chuyện trong Redis
    await updateConversation(convoId, conversation);

    return{
        conversationId: convoId,
        reply: assistantReply,
    }
}

export const handleAIFileMessage=async({userId, conversationId, file, onChunk})=>{
    try {
        let extractedText = "";
        if (file.mimetype === "application/pdf") {
            extractedText = await getPDFContext(file.path);
        } else if (file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
            extractedText = await getDOCXContext(file.path);
        } else {
            throw new Error("Unsupported file type");
        }

        const fileContextText = `Tôi đã tải lên một tệp có tên "${file.originalname}". Dưới đây là nội dung của nó. Hãy phân tích và trả lời các câu hỏi của tôi dựa trên nội dung này.\n\n---NỘI DUNG TỆP---\n${extractedText}`;

    // Gọi hàm xử lý tin nhắn AI chính với nội dung đã trích xuất
    return await handleAIMessage({
        userId,
        conversationId,
        text: fileContextText,
        systemInstruction: null, // System instruction đã có trong cuộc trò chuyện
        onChunk, // Chuyển tiếp callback onChunk để stream phản hồi
        fileInfo: { isFile: true, fileName: file.originalname }
    });
    } finally {
        // Ensure the temporary file is deleted after processing
        if (file && file.path) {
            try {
                await deleteFile(file.path);
            } catch (error) {
                console.error(`Failed to delete temporary AI file ${file.path}:`, error);
            }
        }
    }
}
