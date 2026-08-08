import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../ChatContext';
import closeIcon from '../assets/close.svg';
import sendIcon from '../assets/chat.svg';
import robotIcon from '../assets/robot.svg';
import attachIcon from '../assets/upload.svg';
import conversationService from '../services/conversation.service';
import messageService from '../services/message.service';
import { getSocket } from '../services/socket.js';
import authService from '../services/auth.service';
import linkify from '../utils/linkify.jsx';

const ChatWidget = () => {
    const aiGreetingMessage = {
        _id: 'ai-greeting-initial', // Unique ID for the greeting message
        role: 'model',
        content: 'Xin chào tôi là trợ lý tuyển dụng AI của bạn. Tôi có thể giúp gì cho bạn hôm nay?',
        sender: { _id: 'AI', name: 'AI Assistant' }, // Consistent sender info
        createdAt: new Date().toISOString(), // Timestamp
    };

    const { showChatWidget, chatTarget, closeChat } = useChat();

    // console.log("Initializing messages with chatTarget:", chatTarget.targetType);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [conversationId, setConversationId] = useState(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const currentUser = authService.getCurrentUser();
    const socket = getSocket();

    useEffect(() => {
        // Cleanup and reset state when widget is hidden
        if (!showChatWidget) {
            setConversationId(null);
            setMessages([]);
            return;
        }

        const initConversation = async () => {
            // Guard against missing chatTarget
            if (!chatTarget) return;

            if (chatTarget.targetType === 'AI') {
                setMessages([aiGreetingMessage]); // Reset to only greeting for AI chats
                // AI chat requires a logged-in user. The conversation ID is the user's ID.
                if (currentUser && currentUser.user._id) {
                    const userId = currentUser.user._id;
                    setConversationId(userId);
                    // Ensure the conversation is initialized on the backend.
                    try {
                        await conversationService.createOrGetAI();
                    } catch (error) {
                        console.error("Failed to ensure AI conversation exists on backend.", error);
                    }
                } else {
                    console.error("AI chat requires user to be logged in.");
                    closeChat(); // Close chat if user is not logged in
                }
            } else if (chatTarget.targetId) {
                try {
                    // Backend gets current user's ID from the auth token.
                    const res = await conversationService.getOrCreateConversation(chatTarget.targetId);
                    setConversationId(res.data.data._id);
                } catch (error) {
                    console.error("Failed to initialize user conversation", error);
                }
            }
        };

        initConversation();

    }, [showChatWidget, chatTarget]);

    useEffect(() => {
        if (!conversationId || !socket) return;

        socket.emit('join_conversation', conversationId);

        const isAI = chatTarget?.targetType === 'AI';

        const getMessages = async () => {
            try {
                const res = await messageService.getMessages(conversationId, 50, null, isAI);
                const history = res.data.data || [];
                if (isAI) {
                    // CHỈ HIỆN LỜI CHÀO KHI LÀ AI:
                    // Gộp lời chào mặc định + lịch sử chat từ Server
                    setMessages([aiGreetingMessage, ...history]);
                } else {    
                    // Chat với người dùng/tuyển dụng bình thường:
                    // Chỉ hiện lịch sử chat, không có lời chào AI
                    setMessages(history);
                }
            } catch (error) {
                console.error("Failed to fetch messages", error);
            }
        };

        getMessages();
        
        const handleNewMessage = (newMessage) => {
            if (newMessage.conversationId === conversationId) {
                setMessages((prevMessages) => [...prevMessages, newMessage]);
            }
        };

        const handleAiChunk = (data) => {
            const { conversationId: convoId, chunk } = data;
            if (convoId === conversationId) {
                setMessages((prevMessages) => {
                    const lastMessage = prevMessages[prevMessages.length - 1];
                    if (lastMessage && lastMessage.sender._id === 'AI' && lastMessage.isAIResponse) {
                        const updatedMessage = { ...lastMessage, text: lastMessage.text + chunk };
                        return [...prevMessages.slice(0, -1), updatedMessage];
                    } else {
                        const aiMessage = { _id: `temp-ai-${Date.now()}`, conversationId: convoId, sender: { _id: 'AI', name: 'AI Assistant' }, text: chunk, isAIResponse: true, createdAt: new Date().toISOString() };
                        return [...prevMessages, aiMessage];
                    }
                });
            }
        };

        socket.on('new_message', handleNewMessage);
        socket.on('ai_chunk', handleAiChunk);

        return () => {
            socket.emit('leave_conversation', conversationId);
            socket.off('new_message', handleNewMessage);
            socket.off('ai_chunk', handleAiChunk);
        };
    }, [conversationId, socket, chatTarget]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!text.trim() || !conversationId) return;

        const isAI = chatTarget.targetType === 'AI';

        // Optimistically add user's message for AI chats for better UX
        if (isAI) {
            const userMessage = {
                _id: `temp-user-${Date.now()}`,
                conversationId,
                sender: { _id: currentUser.user._id, name: 'Me' },
                text: text.trim(),
                createdAt: new Date().toISOString(),
            };
            setMessages(prev => [...prev, userMessage]);
        }

        try {
            socket.emit("send_message", { userId: currentUser.user._id, conversationId, text: text.trim(), isAI });
            setText('');
        } catch (error) {
            console.error("Failed to send message", error);
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file || !conversationId) return;

        const isAI = chatTarget.targetType === 'AI';

        // For AI chats, add a message to show the file is being sent/processed
        if (isAI) {
            const userFileMessage = {
                _id: `temp-user-file-${Date.now()}`,
                conversationId,
                sender: { _id: currentUser.user._id, name: 'Me' },
                text: `Đã gửi tệp: ${file.name}`,
                isFile: false, // This is a UI text message
                createdAt: new Date().toISOString(),
            };
            setMessages(prev => [...prev, userFileMessage]);
        }

        try {
            await messageService.sendFile(conversationId, file, isAI);
        } catch (error) {
            console.error("Failed to send file", error);
        } finally {
            e.target.value = null; // Reset file input
        }
    };

    if (!showChatWidget) {
        return null;
    }

    return (
        <div className="fixed bottom-6 right-10 w-80 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50 flex flex-col">
            <div className="flex items-center justify-between p-3 bg-gray-700 rounded-t-lg">
                <div className="flex items-center">
                    {chatTarget.targetType === 'AI' && (
                        <img src={robotIcon} alt="AI Assistant" className="h-6 w-6 mr-2" />
                    )}
                    <h3 className="text-lg font-bold text-green-500">{chatTarget.targetName}</h3>
                </div>
                <button onClick={closeChat} className="p-1 rounded-full hover:bg-gray-600 transition-colors">
                    <img src={closeIcon} alt="Close" className="h-5 w-5" />
                </button>
            </div>

            <div className="flex-grow p-3 overflow-y-auto" style={{ height: '300px' }}>
                {messages.map((msg, index) => {
                    // Xác định xem tin nhắn có phải của người dùng hiện tại không.
                    // Đối với cuộc trò chuyện AI, chúng ta kiểm tra thuộc tính 'role'.
                    // Đối với cuộc trò chuyện thông thường, chúng ta so sánh sender._id.
                    const isUserMessage = msg.role === 'user' || msg.sender?._id === currentUser.user._id;

                    return (
                        <div key={msg._id || `msg-${index}`} className={`flex ${isUserMessage ? 'justify-end' : 'justify-start'} mb-4`}>
                            <div className={`p-2 rounded-lg ${isUserMessage ? 'bg-green-600' : 'bg-gray-600'}`}>
                                {msg.isFile ? (
                                    <a
                                        href={`http://localhost:4000/${msg.filePath.replace(/\\/g, '/')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-300 hover:underline"
                                    >
                                        {msg.text||msg.content}
                                    </a>
                                ) : (
                                    <p className="text-white whitespace-pre-wrap">
                                        {linkify(msg.text||msg.content)}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-2 border-t border-gray-700 flex items-center bg-gray-800 rounded-b-lg w-full box-border">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="p-1.5 rounded-full hover:bg-gray-700 transition-all active:scale-90 flex-shrink-0"
                    title="Đính kèm tệp"
                >
                    <img src={attachIcon} alt="Attach File" className="h-6 w-6 opacity-70 hover:opacity-100" />
                </button>
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    className="flex-grow min-w-0 mx-2 p-2 rounded-lg bg-gray-700 border border-gray-600 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-green-500 transition-all"
                />
                <button type="submit" className="p-2 rounded-full bg-green-600 hover:bg-green-500 shadow-md transition-all active:scale-90 flex-shrink-0 flex items-center justify-center" title="Gửi tin nhắn">
                    <img src={sendIcon} alt="Send" className="h-5 w-5 brightness-0 invert" />
                </button>
            </form>
        </div>
    );
};

export default ChatWidget;