import {Server} from 'socket.io';
import {verifyToken} from '../utils/jwt.js';
import Conversation from '../models/Conversation.model.js';
import {sendMessage,handleAIMessage} from './message.service.js';
import { startInterview, processUserTextTurn, endInterviewAndAnalyze } from './geminiInterview.service.js'; // Import interview services

const onlineUsers=new Map();
let io;
export const getIo = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};
export const getSocketIdForUser = (userId) => {
    return onlineUsers.get(userId);
};

export const initSocket=(server)=>{
    io=new Server(server,{
        cors:{
            origin: "http://localhost:5173",
            methods:["GET","POST"],
            credentials:true
        }
    });
    

    //authentication middleware
    io.use(async(socket,next)=>{
        const token=socket.handshake.auth.token;
        if(!token){
            return next(new Error("Authentication error: Token not provided"));
        }
        try{
            const decoded=verifyToken(token);
            socket.user=decoded;
            next();
        }
        catch(err){
            return next(new Error("Authentication error: Invalid token"));
        }
    })
    io.on('connection',async(socket)=>{
        console.log('New client connected:',socket.id);
        
        onlineUsers.set(socket.user.userId,socket.id);
        socket.join(socket.user.userId); // Đảm bảo ID là chuỗi khi tham gia phòng
        //user's conversations
        try{
            const conversations=await Conversation.find({members:socket.user.id})
            conversations.forEach((conv)=>{
                socket.join(conv._id.toString());
            })
        }catch(err){
            console.error("Failed to join conversation rooms: ",err);
        }
        //join conversation room
        socket.on('join_conversation',(conversationId)=>{
            socket.join(conversationId);
        })
        
         //leave conversation room
         socket.on('leave_conversation',(conversationId)=>{
            socket.leave(conversationId);
        })
        
        //send message event
        socket.on("send_message",async(data)=>{
            const {conversationId,text,isAI}=data;
            const userId = socket.user.userId; // Luôn sử dụng userId từ token đã xác thực để tăng cường bảo mật.
            if(!conversationId||!text)return;
            try{
                // Pass io to the service function, and let the service handle emission
                if(!isAI)
                await sendMessage(userId,conversationId,text); // io is retrieved internally by messageService
                // The service function now emits 'new_message', so no need to emit here
                else handleAIMessage({userId, conversationId, text, onChunk:(chunk)=>{
                    socket.emit("ai_chunk",{conversationId,chunk});
                }});

            }catch(err){
                console.error("Error sending message: ",err);
                socket.emit("error","Failed to send message");
            }
        })
        
        socket.on('user_text_turn', async (data) => {
            const { sessionId, text } = data;
            const userId = socket.user.userId;

            if (!sessionId || !text) {
                socket.emit('interview_error', 'Session ID and text are required.');
                return;
            }

            try {
                // The onAudioChunk callback will emit audio data directly to the client
                await processUserTextTurn(sessionId, text, (audioChunk, mimeType) => {
                    socket.emit('ai_audio_chunk', { sessionId, audioChunk, mimeType });
                });
            } catch (error) {
                console.error(`Error processing user text turn for session ${sessionId}:`, error);
                socket.emit('interview_error', error.message || 'Failed to process user input.');
            }
        });

        socket.on('user_audio_turn', async (data) => {
            const { sessionId, audioChunk } = data;
            //console.log("Received user audio turn data:", data);
            if (!sessionId || !audioChunk) return;
            
            try {
                // const { processUserAudioTurn } = await import('./geminiInterview.service.js');
                // await processUserAudioTurn(sessionId, audioChunk, (audio, mimeType) => {
                //     socket.emit('ai_audio_chunk', { sessionId, audioChunk: audio, mimeType });
                // });
                const {processUserTextTurn} = await import('./geminiInterview.service.js');
                // Convert audioChunk (base64 string) back to Buffer
                const audioBuffer = Buffer.from(audioChunk, 'base64');
                // Process the audio turn as if it were text input, since Gemini may not support raw audio input directly
                await processUserTextTurn(sessionId, 'Đây là tin nhắn kiểm tra tín hiệu, hãy phản hồi nếu nó hoạt động', (audio, mimeType) => {
                    socket.emit('ai_audio_chunk', { sessionId, audioChunk: audio, mimeType });
                });
            } catch (error) {
                console.error(`Error processing user audio turn:`, error);
            }
        });

        socket.on('trigger_greeting', async (data) => {
            const { sessionId } = data;
            if (!sessionId) return;
            try {
                const { triggerInitialGreeting } = await import('./geminiInterview.service.js');
                triggerInitialGreeting(sessionId);
            } catch (error) {
                console.error(`Error triggering greeting:`, error);
            }
        });

        socket.on('end_interview', async (data) => {
            const { sessionId } = data;
            const userId = socket.user.userId;

            if (!sessionId) {
                socket.emit('interview_error', 'Session ID is required to end an interview.');
                return;
            }

            try {
                const { finalMessage, analysis } = await endInterviewAndAnalyze(sessionId, (audioChunk, mimeType) => {
                    socket.emit('ai_audio_chunk', { sessionId, audioChunk, mimeType }); // Stream final message audio
                });
                socket.emit('interview_ended', { sessionId, finalMessage, analysis });
                console.log(`Interview ended for user ${userId} with session ${sessionId}`);
            } catch (error) {
                console.error(`Error ending interview for session ${sessionId}:`, error);
                socket.emit('interview_error', error.message || 'Failed to end interview.');
            }
        });

        //disconnect
        socket.on('disconnect',()=>{
            console.log('Client disconnected:',socket.id);
            onlineUsers.delete(socket.user.userId);
        });

    });
}