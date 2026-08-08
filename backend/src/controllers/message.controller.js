import * as messageService from "../services/message.service.js";

export const getMessages=async(req,res)=>{
    try{
        const userId=req.user.id;
        const {conversationId,limit=20,before,isAI}=req.query;
        console.log(req.query);
        const messages=await messageService.getMessages(conversationId,limit,before,isAI);
        res.status(200).json({data:messages});
    }
    catch(err){
        res.status(400).json({ message: err.message });
    }
}
export const sendMessage=async(req,res)=>{ // No io parameter
    try{
        const userId=req.user.userId;
        const {conversationId,text}=req.body;
        const message=await messageService.sendMessage(userId,conversationId,text); // No io passed
        res.status(201).json({data:message});
    }
    catch(err){
        res.status(400).json({ message: err.message });
    }
}

export const sendFile=async(req,res)=>{ // No io parameter
    try{
        const userId=req.user.userId;
        const {conversationId, isAI}=req.body;
        const file=req.file;
        // The service layer handles the logic for both AI and regular file messages.
        const result = await messageService.sendFile(userId, conversationId, file, isAI === 'true');

        res.status(201).json({data: result});
    }
    catch(err){
        res.status(400).json({ message: err.message });
    }
}