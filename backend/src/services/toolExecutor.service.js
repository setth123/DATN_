import * as jobService from "./job.service.js";
import * as recommendedService from "./recommended.service.js";
import * as candidateService from "./candidate.service.js";
import { LEVEL_MAP, JOB_LEVEL_MAP } from "./matching.service.js"; // Import LEVEL_MAP và JOB_LEVEL_MAP để đảm bảo tính nhất quán

// Định nghĩa ánh xạ từ tên tool sang các hàm dịch vụ tương ứng
const toolFunctionMap = {
  searchJobs: async ({ keyword, skill, level }) => {
    const query = {};
    if (keyword) query.keyword = keyword;
    if (skill) query.skill = skill; // job.service.js getJobs mong đợi 'skill' (số ít)
    if (level) query.level = level;

    const result = await jobService.getJobs(query);
    const jobs = result.data.map(job => ({
      url: `http://localhost:5173/jobs/${job._id}`,
      title: job.title,
    }));
    // Trả về dữ liệu job đã được đơn giản hóa cho AI
    // Gemini yêu cầu tool output phải là một object, không phải là một array.
    return { jobs };
  },

  recommendJobsForCandidate: async ({ userId }) => {
    // Giả định candidateId từ tool schema là userId của ứng viên
    const result = await recommendedService.recommendJobs(userId);
    const recommendedJobs = result.map(item => ({
      url: `http://localhost:5173/jobs/${item.job._id}`,
      title: item.job.title,
      matchScore: item.matchScore
    }));
    // Gemini yêu cầu tool output phải là một object, không phải là một array.
    return { recommendedJobs };
  },

  recommendCandidatesForJob: async ({ jobId }, userId) => {
    // Hàm này yêu cầu userId của nhà tuyển dụng để kiểm tra quyền sở hữu công ty
    if (!userId) {
      throw new Error("User ID (recruiter) is required for recommendCandidatesForJob.");
    }
    const result = await recommendedService.recommendCandidatesForJob(userId, jobId);
    return {
      candidates: result.candidates.map(candidate => ({
        url: `http://localhost:5173/candidate/${candidate.candidate._id}`,
        fullname: candidate.candidate.fullName,
        title: candidate.candidate.title,
        matchScore: candidate.matchScore
      }))
    };
  },

  analyzeCandidateGapForJob: async ({ userId, jobId }) => {
    // Giả định candidateId từ tool schema là userId của ứng viên
    const job = await jobService.getJobById(jobId);
    const candidate = await candidateService.getMyCandidateProfile(userId); // Giả định candidateId là userId

    if (!job || !candidate) {
      return { error: "Không tìm thấy Job hoặc Candidate để phân tích khoảng cách." };
    }

    const missingSkills = job.requiredSkills.filter(
      jobSkill => !candidate.skills?.some(candidateSkill => candidateSkill.name.toLowerCase() === jobSkill.name.toLowerCase())
    );

    let levelGap = 0;
    // Sử dụng JOB_LEVEL_MAP cho cấp độ tổng thể của ứng viên và công việc
    // Giả định candidate.title có thể ánh xạ tới một trong các cấp độ trong JOB_LEVEL_MAP
    // Đây là một giả định cần được xác nhận hoặc cải thiện trong mô hình dữ liệu của Candidate
    const candidateOverallLevel = JOB_LEVEL_MAP[candidate.title] || 0;
    const jobOverallLevel = JOB_LEVEL_MAP[job.level] || 0;

    // So sánh cấp độ tổng thể
    if (candidateOverallLevel < jobOverallLevel) {
      levelGap = jobOverallLevel - candidateOverallLevel;
    }

    return {
      jobTitle: job.title,
      candidateName: candidate.fullName,
      missingSkills: missingSkills.length > 0 ? missingSkills : "Không thiếu kỹ năng nào.",
      levelGap: levelGap > 0 ? `Cấp độ của ứng viên thấp hơn ${levelGap} cấp so với yêu cầu của công việc.` : "Cấp độ của ứng viên đáp ứng hoặc vượt quá yêu cầu công việc."
    };
  }
};

export const executeTool = async (toolName, args, userId) => {
  try {
    const func = toolFunctionMap[toolName];
    if (!func) {
      // Trả về định dạng mà AI hiểu được thay vì throw error làm sập luồng
      return { error: `Tool ${toolName} không tồn tại.` };
    }
    
    // Thực thi hàm
    const result = await func(args, userId);
    return result;
  } catch (error) {
    console.error(`Lỗi thực thi tool ${toolName}:`, error);
    return { error: error.message || "Lỗi hệ thống khi thực thi công cụ." };
  }
};
