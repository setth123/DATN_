import { GoogleGenAI } from "@google/genai";
import { tools } from "../ai/tools.schema.js";
import { executeTool } from "./toolExecutor.service.js";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const runGemini = async (messages, onChunk, userId, systemInstruction) => {
  try {
    // Tạo một bản sao "sạch" của lịch sử, chỉ chứa các trường mà API của Gemini chấp nhận.
    // Điều này loại bỏ các trường tùy chỉnh như 'isFile' và 'fileName'.
    const cleanMessages = messages.map(msg => ({
      role: msg.role,
      parts: msg.parts
    })).filter(msg => 
        msg.parts && msg.parts.some(p => p.text && p.text.trim() !== '')
    );

    // Lấy tin nhắn cuối cùng làm userPrompt và xóa nó khỏi history
    
    const userPrompt = cleanMessages.pop()?.parts.map(p => p.text).join('\n') || "";

    // KHỞI TẠO CHAT SESSION: Truyền history, tools và systemInstruction vào config
    const chat = genAI.chats.create({
      model: "gemini-2.5-flash", // Thay đổi model nếu cần
      config: {
        systemInstruction: systemInstruction,
        tools: tools
      },
      history: cleanMessages
    });
    // Gửi tin nhắn và nhận stream về
    //console.log("Sending user prompt to Gemini:", userPrompt);
    const result = await chat.sendMessageStream({
      message:userPrompt
    });
    console.log(">>> Request sent to Gemini. Waiting for stream...");
    // CHỈNH SỬA 2: handleStream bây giờ sẽ TRẢ VỀ văn bản cuối cùng thu thập được
    const finalAiResponse = await handleStream(result, chat, onChunk, userId);

    // CHỈNH SỬA 3: Sau khi gọi xong hết Tool, hãy lưu finalAiResponse vào Database/State của bạn
    // Ví dụ: await saveMessageToDB(userId, "model", finalAiResponse);
    return finalAiResponse;

  } catch (error) {
    handleError(error, onChunk);
  }
};

async function handleStream(result, chat, onChunk, userId) {
  let accumulatedText = ""; 
  let functionCalls = null;
  let isAnswerStarted = false;

  // result có thể được duyệt trực tiếp trong @google/genai
  for await (const chunk of result) {
    // LƯU Ý: Trong SDK mới, functionCalls là property, không phải function
    const calls = chunk.functionCalls; 
    if (calls && calls.length > 0) {
      functionCalls = calls;
      continue; 
    }

    try {
      // LƯU Ý: Trong SDK mới, text là property, không phải function
      let text = chunk.text; 
      if (text) {
        if (!isAnswerStarted) {
          const index = text.indexOf("[ANSWER]");
          if (index !== -1) {
            isAnswerStarted = true;
            // Lấy phần text sau tag "[ANSWER]"
            const remainingText = text.substring(index + "[ANSWER]".length); 
            if (remainingText.trim() !== "") { // Chỉ gửi nếu có nội dung thực sự sau tag
              accumulatedText += remainingText;
              onChunk(remainingText);
            }
          }
        } else {
          // Khi đã tìm thấy "[ANSWER]", gửi tất cả các chunk text tiếp theo.
          accumulatedText += text;
          onChunk(text);
        }
      }
    } catch (e) {
      // Chunk không chứa text
    }
  }

  // Xử lý Tool Calls nếu model yêu cầu
  if (functionCalls) {
    const toolResponses = [];
    for (const fnCall of functionCalls) {
      // Lưu ý kiểm tra logic phân quyền (role_id) trong executeTool qua Database như rule bảo mật của hệ thống
      const output = await executeTool(fnCall.name, fnCall.args, userId);
      
      // Chuẩn bị payload trả về cho model
      toolResponses.push({
        functionResponse: { 
          name: fnCall.name, 
          response: output 
        }
      });
    }

    // Gửi kết quả chạy tool lại vào stream của phiên chat
    const nextResult = await chat.sendMessageStream({ message: toolResponses });
    
    // Đệ quy để lấy câu trả lời cuối cùng sau khi model nhận được data từ tool
    const nextText = await handleStream(nextResult, chat, onChunk, userId);
    accumulatedText += nextText;
  }

  return accumulatedText;
}

/**
 * Hàm xử lý lỗi tập trung
 */
function handleError(error, onChunk) {
  console.error("Gemini API Error:", error);
  let userFriendlyMsg = "Đã có lỗi xảy ra khi kết nối với AI.";

  if (error.message?.includes("503") || /unavailable/i.test(error.message)) {
    userFriendlyMsg = "Dịch vụ AI đang quá tải (503). Bạn vui lòng thử lại sau giây lát nhé.";
  } else if (error.message?.includes("429")) {
    userFriendlyMsg = "Bạn đã gửi quá nhiều yêu cầu. Vui lòng đợi một chút.";
  }

  onChunk(userFriendlyMsg);
}