import { GoogleGenAI,Modality,MediaResolution } from '@google/genai';
import fs from 'fs';
import path from 'path';

// Initialize SDK
const genAI = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

const INTERVIEW_SYSTEM_INSTRUCTION = `
Role: Bạn tên Trang, bạn là một nhà tuyển dụng cấp cao, thân thiện và chuyên nghiệp, đang thực hiện một cuộc phỏng vấn bằng âm thanh.
Rules:
- Giao tiếp HOÀN TOÀN bằng âm thanh. Bạn không cần tạo text dài, hãy trả lời ngắn gọn, tự nhiên như đang nói chuyện.
- Chỉ hỏi từng câu một. Chờ ứng viên trả lời xong rồi mới hỏi câu tiếp theo.
- Đánh giá câu trả lời của ứng viên một cách ngầm dựa trên phương pháp STAR (Situation, Task, Action, Result) khi có thể.
- Nếu ứng viên trả lời lan man, hãy khéo léo ngắt lời và hướng họ trở lại câu hỏi.
- Buổi phỏng vấn chỉ kéo dài khoảng 15 phút, vì vậy hãy tập trung vào những câu hỏi trọng tâm, tránh lan man.
- Bắt đầu bằng cách chào hỏi ứng viên một cách thân thiện và hỏi một vài câu hỏi cơ bản để làm quen.
- Nếu nhận được lời nhắn từ hệ thống rằng ứng viên đã im lặng quá lâu, hãy chuyển sang câu tiếp theo hoặc gợi ý cho họ.
- Bạn sẽ nhận được bối cảnh về CV và JD trong lời nhắc đầu tiên. Hãy dựa vào đó để tiến hành phỏng vấn.
`;

function createWavHeader(dataLength, sampleRate = 24000) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const buffer = Buffer.alloc(44);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataLength, 40);

  return buffer;
}

const interviewSessions = new Map(); 
const audioFileStreams = new Map();

export const startInterview = async (sessionId, cvContext, jdContext, onAudioChunk) => {
  try {
    // CHỈNH SỬA 1: Sử dụng genAI.live.connect thay cho genAI.connectLive
    const connection = await genAI.live.connect({
      model: 'models/gemini-2.5-flash-native-audio-preview-12-2025',
      config: {
        responseModalities: [Modality.AUDIO],
        mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
         speechConfig: {
           voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
         },
         systemInstruction: INTERVIEW_SYSTEM_INSTRUCTION,
      },
      callbacks: {
        onopen: () => console.log('Kết nối phỏng vấn đã mở.'),
        onmessage: (serverMessage) => {
          const interviewSession = interviewSessions.get(sessionId);
          if (!interviewSession) return;
          if (serverMessage.serverContent?.interrupted) {
    console.log("⚠️ AI báo: Tôi bị bạn ngắt lời!");
  }
  if (serverMessage.serverContent?.turnComplete) {
    console.log("✅ AI báo: Tôi đã nghe xong và đang chuẩn bị trả lời.");
  }
          if (serverMessage.serverContent?.modelTurn?.parts) {
            const parts = serverMessage.serverContent.modelTurn.parts;
            
            for (const part of parts) {
              if (part.inlineData) {
                const base64Data = part.inlineData.data;
                const mimeType = part.inlineData.mimeType || 'audio/pcm;rate=24000';
                
                const audioBuffer = Buffer.from(base64Data, 'base64');
                const sampleRateMatch = mimeType.match(/rate=(\d+)/);
                const sampleRate = sampleRateMatch ? parseInt(sampleRateMatch[1]) : 24000;

                const wavHeader = createWavHeader(audioBuffer.length, sampleRate);
                const completeWavChunk = Buffer.concat([wavHeader, audioBuffer]);

                onAudioChunk(completeWavChunk);
              }

              if (part.text) {
                interviewSession.currentAiResponse += part.text;
                console.log("AI Text:", part.text);
              }
            }
          }

          if (serverMessage.serverContent?.turnComplete) {
            if (interviewSession.currentAiResponse) {
              interviewSession.transcript.push({ 
                role: 'model', 
                parts: [{ text: interviewSession.currentAiResponse }] 
              });
              interviewSession.currentAiResponse = "";
            }
          }
        },
        onerror: (e) => console.error('Lỗi:', e),
        onclose: (e) => console.log('Kết nối đóng:', e.reason || "Client disconnect"),
      }}
    );

    const interviewData = {
      connection,
      transcript: [],
      currentAiResponse: "",
      cvContext,
      jdContext,
    };
    interviewSessions.set(sessionId, interviewData);

  } catch (error) {
    console.error("Failed to start interview session:", error);
    throw error; 
  }
};

export const triggerInitialGreeting = (sessionId) => {
  const session = interviewSessions.get(sessionId);
  if (!session || !session.connection) {
      console.error("Session not ready to trigger greeting");
      return;
  }

  const initialPrompt = `
    Bối cảnh phỏng vấn:
    - Nội dung CV của ứng viên: "${session.cvContext}"
    - Nội dung mô tả công việc (JD): "${session.jdContext}"

    Yêu cầu: Dựa vào bối cảnh trên, hãy bắt đầu buổi phỏng vấn. Gửi lời chào đầu tiên của bạn đến ứng viên.
  `;
  
  // CHỈNH SỬA 2: Truyền text thông qua connection.send
  session.connection.sendClientContent({
      turns: [{ role: "user", parts: [{ text: initialPrompt }] }],
      turnComplete: true,
  });
  session.transcript.push({ role: 'user', parts: [{ text: "[Hệ thống gửi bối cảnh CV & JD]" }] });
};

export const processUserAudioTurn = async (sessionId, audioBuffer) => {
  const session = interviewSessions.get(sessionId);
  if (!session || !session.connection) throw new Error("Interview session not found or has expired.");
  // CHỈNH SỬA 3: Gửi base64 string dạng mảng thay vì trực tiếp đưa raw Buffer
  session.connection.sendRealtimeInput([{
    mimeType: "audio/pcm;rate=16000",
    data: audioBuffer.toString("base64"), 
  }]);
  session.transcript.push({ role: 'user', parts: [{ text: "[Người dùng phát biểu bằng giọng nói]" }] });
};

export const processUserTextTurn = async (sessionId, userText) => {
  const session = interviewSessions.get(sessionId);
  if (!session || !session.connection) throw new Error("Interview session not found or has expired.");

  session.transcript.push({ role: 'user', parts: [{ text: userText }] });

  session.connection.sendClientContent({
      turns: [{ role: "user", parts: [{ text: userText }] }],
      turnComplete: true,
  });
};
export const finalizeDebugAudio = (sessionId) => {
  const rawPath = path.join(process.cwd(), `debug_${sessionId}.raw`);
  const wavPath = path.join(process.cwd(), `debug_${sessionId}.wav`);

  if (fs.existsSync(rawPath)) {
    const rawData = fs.readFileSync(rawPath);
    const header = createWavHeader(rawData.length, 16000);
    const finalWav = Buffer.concat([header, rawData]);
    
    fs.writeFileSync(wavPath, finalWav);
    fs.unlinkSync(rawPath); // Xóa file raw tạm
    console.log(`✅ Đã tạo file debug hoàn chỉnh: ${wavPath}`);
  }
};
export const endInterviewAndAnalyze = async (sessionId) => {
  finalizeDebugAudio(sessionId);
  const session = interviewSessions.get(sessionId);
  if (!session || !session.connection) throw new Error("Interview session not found.");

  const finalPrompt = "Buổi phỏng vấn đã kết thúc. Hãy đưa ra một câu kết luận lịch sự và chào tạm biệt ứng viên để kết thúc buổi phỏng vấn này.";
  
  session.connection.sendClientContent({
      turns: [{ role: "user", parts: [{ text: finalPrompt }] }],
      turnComplete: true,
  });

  await new Promise(resolve => setTimeout(resolve, 3500));
  
  if (session.connection.close) {
      session.connection.close();
  }

  const analysisResult = await analyzeInterviewTranscript(session.transcript);
  interviewSessions.delete(sessionId);
  return { finalMessage: "Phỏng vấn kết thúc.", analysis: analysisResult };
};

const analyzeInterviewTranscript = async (transcript) => {
  const analysisSystemInstruction = `Bạn là một Chuyên gia Đánh giá Tuyển dụng (HR Analyst) tên là Jarvis có 20 năm kinh nghiệm.
Nhiệm vụ: Phân tích bản ghi (transcript) của buổi phỏng vấn âm thanh để đưa ra đánh giá chi tiết về ứng viên.
Dữ liệu đầu vào: Một đoạn hội thoại giữa Người phỏng vấn (model) và Ứng viên (user).
Yêu cầu phân tích:
1. Kỹ năng chuyên môn: Đánh giá độ chính xác và chiều sâu của các câu trả lời kỹ thuật.
2. Kỹ năng mềm: Đánh giá khả năng diễn đạt, sự tự tin và tư duy giải quyết vấn đề.
3. Thái độ: Phân tích sự chuyên nghiệp và mức độ nhiệt huyết qua cách dùng từ.
Quy tắc phản hồi:
- Luôn phản hồi dưới định dạng JSON nguyên khối (không kèm văn bản thừa).
- Đánh giá khách quan, không thiên vị.
- Nếu dữ liệu hội thoại quá ngắn hoặc không đủ thông tin, hãy ghi chú vào phần "limitations".
Cấu trúc JSON yêu cầu:
{"summary": "Tóm tắt ngắn gọn buổi phỏng vấn (2-3 câu).","scores": {"technical": 0,"communication": 0,"problem_solving": 0},"strengths": ["Điểm mạnh 1"],"weaknesses": ["Điểm yếu 1"],"key_takeaways": ["Ý chính quan trọng rút ra"],"hiring_decision": "Tuyển dụng/Cân nhắc/Loại","feedback_for_candidate": "Lời khuyên chân thành để ứng viên cải thiện.","limitations": "Ghi chú nếu cuộc phỏng vấn quá ngắn hoặc thiếu thông tin để đánh giá."}`;

  const analysisPrompt = `Đây là bản ghi cuộc phỏng vấn:\n\n${JSON.stringify(transcript)}\n\nHãy phân tích và trả về kết quả dưới dạng JSON theo yêu cầu.`;

  try {
    // CHỈNH SỬA 4: Gọi generateContent trực tiếp từ thuộc tính models thay vì tạo analysisModel
    const result = await genAI.models.generateContent({
      model: "gemma-4-31b-it", // Thay bằng gemini-2.5-flash nếu bạn không thiết lập route gemma
      contents: analysisPrompt,
      config: {
        systemInstruction: analysisSystemInstruction,
        responseMimeType: "application/json"
      }
    });
    
    // CHỈNH SỬA 5: Thuộc tính text là getter chứ không phải hàm
    return JSON.parse(result.text); 
  } catch (error) {
    console.error("Error during interview analysis:", error);
    return { error: "Failed to analyze interview transcript." };
  }
};
