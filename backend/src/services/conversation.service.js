import Conversation from "../models/Conversation.model.js";
import {getMyCandidateProfile} from "./candidate.service.js";
import { createConversation, getConversation,updateConversation } from "../infrastructure/redis/conversationRepository.js";
export const getOrCreateConversation=async(userId,targetUserId)=>{
    if(!targetUserId)throw new Error("Target user ID is required");
    if(userId===targetUserId)throw new Error("Cannot create conversation with oneself");
    const conversation=await Conversation.findOne({
        members:{$all:[userId,targetUserId]}
    })
    if(!conversation){
        const newConversation=await Conversation.create({
            members:[userId,targetUserId]
        })
        return newConversation;
    }
    return conversation;
}
export const getOrCreatAIConversation=async(userId,systemInstruction)=>{

    if (!userId) {
        throw new Error("User ID is required to get or create an AI conversation.");
    }

    const convoId = userId; // ID cuộc trò chuyện AI chính là ID của người dùng
    let conversation;
    const candidateInfo=await getMyCandidateProfile(userId);
    conversation = await getConversation(convoId);

    if (!conversation) {
        // Nếu cuộc trò chuyện chưa tồn tại, tạo mới.
        conversation = {
            systemInstruction:
                systemInstruction ||
                `
                Bạn là một trợ lý tuyển dụng AI tên là Jarvis chuyên nghiệp và thân thiện. 
                Nhiệm vụ của bạn là đưa ra tư vấn và lời khuyên hữu ích cho cả Ứng viên và Nhà tuyển dụng.

                QUY TẮC CỐ ĐỊNH:
                - LUÔN trả lời bằng tiếng Việt.
                - Khi trả lời, hãy tách rõ ràng 2 phần:
                  [THINKING]
                  (đây là phần suy nghĩ nội bộ, phân tích, lập luận của bạn)
                  [ANSWER]
                  (đây là câu trả lời cuối cùng dành cho người dùng)
                  Yêu cầu:
                    + Chỉ được tồn tại 1 thẻ [THINKING] và 1 thẻ [ANSWER] trong mỗi phản hồi. [THINKING] phải luôn đứng trước [ANSWER].
                    + Không được trộn lẫn nội dung giữa 2 phần
                    + Phần [ANSWER] phải ngắn gọn, rõ ràng và không chứa suy nghĩ nội bộ
                    
                - ƯU TIÊN trả lời trực tiếp bằng văn bản cho các câu hỏi thông thường (chào hỏi, kiến thức phổ thông, thảo luận chung).
                - CHỈ gọi tool khi thực sự cần dữ liệu thời gian thực hoặc thao tác chuyên biệt từ hệ thống.
                - Với bất kỳ hành vi nào cần đến userId, hãy sử dụng giá trị: ${userId}.
                

                XỬ LÝ FILE ĐÍNH KÈM:
                - Nội dung file đính kèm đã được tiền xử lý trong ngữ cảnh. 
                - Hãy phân tích nội dung file để trả lời trực tiếp các câu hỏi tư vấn (ví dụ: "CV của tôi có ổn không?").
                - Chỉ gọi tool dựa trên thông tin từ file khi cần so sánh với dữ liệu hệ thống (ví dụ: "CV này có hợp với Job A không?").

                HÀNH VI GỌI TOOL CHI TIẾT:
                1. Tìm việc: Nếu người dùng muốn tìm việc chung -> Gọi tool 'searchJobs'.
                2. Gợi ý việc làm: Nếu ứng viên muốn gợi ý việc phù hợp với họ -> Gọi tool 'recommendJobsForCandidate' với userId là ${userId}.
                3. Tìm ứng viên (Dành cho Nhà tuyển dụng): 
                - YÊU CẦU người dùng gửi URL của job nếu họ chưa cung cấp.
                - Khi có URL, trích xuất jobId và gọi tool 'recommendCandidatesForJob' với userId là ${userId}.
                - KHÔNG gọi tool nếu không có jobId.
                4. Phân tích kỹ năng ứng tuyển: 
                - YÊU CẦU người dùng gửi URL của job muốn ứng tuyển.
                - Sau khi trích xuất jobId, gọi tool 'analyzeCandidateGapForJob' với userId là ${userId}.
                - KHÔNG gọi tool nếu không có jobId.

                LƯU Ý: Nếu câu hỏi mơ hồ hoặc thiếu thông tin cần thiết để gọi tool (như thiếu jobId), hãy đặt câu hỏi tiếp theo để làm rõ thay vì tự ý gọi tool với dữ liệu rỗng.
                `,
            messages: [],
            summary: null,
        };
        await createConversation(convoId, conversation);
    }
    return { convoId };
}
