import { runGemini } from "../services/gemini.service.js"; // Đã sửa đường dẫn import
import {PDFParse} from "pdf-parse";
import mammoth from "mammoth";
export function buildPrompt(messages,systemInstruction, summary,text) {
  let prompt = `SYSTEM:\n${systemInstruction}\n\n`;

  if(messages.length>0){
    prompt+=`QUESTION:${text}\n`
    prompt+=`CONTEXT:\n`;
    if(summary){
      for (const msg of summary) {
        prompt += `${msg.role.toUpperCase()}: ${msg.content}\n`;
      }
    }
    else{
      for (const msg of conversation.messages) {
        prompt += `${msg.role.toUpperCase()}: ${msg.content}\n`;
      }
    }
  }

  prompt += "ASSISTANT:";
  return prompt;
}

export async function maybeSummarize(conversation) {
  if (conversation.messages.length < 12) return;

  // Tạo một prompt cho việc tóm tắt
  const summarizationMessages = [
    {
      role: "user",
      content: `Tóm tắt ngắn gọn cuộc hội thoại sau thành 3–5 gạch đầu dòng, giữ lại ý định và thông tin quan trọng:\n\n${conversation.messages
        .map(m => `${m.role.toUpperCase()}: ${m.content}`)
        .join("\n")}`
    }
  ];

  // Gọi runGemini để tóm tắt. Không cần onChunk hoặc userId cho việc tóm tắt.
  // Hàm runGemini mong đợi một mảng các tin nhắn.
  // Đối với việc tóm tắt, chúng ta không mong đợi các lệnh gọi tool, vì vậy có thể truyền null cho onChunk và userId.
  const summary = await runGemini(summarizationMessages, () => {}, null, null);

  conversation.summary = summary;
  conversation.messages = conversation.messages.slice(-6);
}
export async function getPDFContext(filePath) {
    try {
        const parser=new PDFParse({url: filePath});
        const res=await parser.getText();
        return res.text;
    } catch (err) {
        console.error("Error extracting PDF text:", err);
        return "";
    }
}
export async function getDOCXContext(filePath) {
    try {
        const data = await mammoth.extractRawText({ path: filePath });
        return data.value;
    } catch (err) {
        console.error("Error extracting DOCX text:", err);
        return "";
    }
}