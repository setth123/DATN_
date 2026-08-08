import * as conversationService from '../services/conversation.service.js';

export const getOrCreateConversation = async (req,res) => {
    try{
        const userId=req.user.userId; // Sử dụng ID của người dùng đã xác thực
        const targetUserId=req.body.targetUserId;
        
        const conversation=await conversationService.getOrCreateConversation(userId,targetUserId);
        res.status(200).json({data:conversation});
    }
    catch(err){
        res.status(400).json({ message: err.message });
    }
}

export const createOrGetAIConversation=async(req,res)=>{
    try{
        const userId = req.user.userId; // Lấy userId từ token đã xác thực
        const systemInstruction=req.body.systemInstruction; // Optional: client có thể tùy chỉnh system instruction cho cuộc trò chuyện AI
        
        const { convoId } = await conversationService.getOrCreatAIConversation(userId,systemInstruction);
        res.status(200).json({ data: { _id: convoId } });
    }
    catch(err){
        res.status(400).json({ message: err.message });
    }
}