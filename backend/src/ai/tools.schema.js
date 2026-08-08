export const tools = [
  {
    functionDeclarations: [
      {
        name: "searchJobs",
        description: "Tìm kiếm công việc dựa trên từ khóa, kỹ năng hoặc cấp độ khi người dùng yêu cầu cụ thể.",
        parameters: {
          type: "OBJECT", // Viết hoa
          properties: {
            keyword: {
              type: "STRING",
              description: "Từ khóa chính trong tiêu đề công việc"
            },
            skills: { // Đổi thành số nhiều và dạng mảng để lấy được nhiều skill
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  name: { type: "STRING", description: "Tên kỹ năng" },
                  level: { 
                    type: "STRING", 
                    enum: ["Cơ bản", "Trung bình", "Khá", "Thành thạo", "Chuyên gia"] 
                  }
                }
              },
              description: "Danh sách các kỹ năng yêu cầu"
            },
            level: {
              type: "STRING",
              enum: ["Intern", "Fresher", "Junior", "Mid", "Senior"],
              description: "Cấp độ vị trí công việc"
            }
          }
        }
      },
      {
        name: "recommendJobsForCandidate",
        description: "Tự động gợi ý danh sách công việc phù hợp nhất với hồ sơ của ứng viên hiện tại.",
        parameters: {
          type: "OBJECT",
          properties: {
            userId: { type: "STRING", description: "ID định danh của người dùng" }
          },
          required: ["userId"]
        }
      },
      {
        name: "recommendCandidatesForJob",
        description: "Tìm kiếm và gợi ý danh sách các ứng viên phù hợp nhất cho một mã tin tuyển dụng cụ thể.",
        parameters: {
          type: "OBJECT",
          properties: {
            jobId: { type: "STRING", description: "ID định danh của công việc" }
          },
          required: ["jobId"]
        }
      },
      {
        name: "analyzeCandidateGapForJob",
        description: "So sánh hồ sơ ứng viên với yêu cầu công việc để tìm ra các kỹ năng còn thiếu hoặc chênh lệch trình độ.",
        parameters: {
          type: "OBJECT",
          properties: {
            userId: { type: "STRING" },
            jobId: { type: "STRING" }
          },
          required: ["userId", "jobId"]
        }
      }
    ]
  }
];