export const LEVEL_MAP = {
  "Cơ bản": 1,
  "Trung bình": 2,
  "Khá": 3,
  "Thành thạo": 4,
  "Chuyên gia": 5
};

export const JOB_LEVEL_MAP = {
  "Intern": 1,
  "Fresher": 2,
  "Junior": 3,
  "Mid": 4,
  "Senior": 5
};


const calcSkillMatch = (jobSkills, candidateSkills) => {
  if (!jobSkills || jobSkills.length === 0) return 1.0; // Nếu job không yêu cầu skill, mặc định pass 100%
  if (!candidateSkills || candidateSkills.length === 0) return 0;

  let totalSkillScore = 0;

  jobSkills.forEach(jobSkill => {
    const jobSkillNameLower = jobSkill.name.toLowerCase().trim();
    const requiredLevel = LEVEL_MAP[jobSkill.level] || 1;

    // Tìm skill tương ứng tốt nhất của ứng viên cho yêu cầu này
    let bestMatchScoreForThisSkill = 0;

    candidateSkills.forEach(candidateSkill => {
      const candidateSkillNameLower = candidateSkill.name.toLowerCase().trim();
      const candidateLevel = LEVEL_MAP[candidateSkill.level] || 1;

      // So khớp tên (Node.js vs Nodejs)
      const nameMatch = candidateSkillNameLower.includes(jobSkillNameLower) || 
                        jobSkillNameLower.includes(candidateSkillNameLower);

      if (nameMatch) {
        let currentScore = 0;
        if (candidateLevel >= requiredLevel) {
          currentScore = 1; // Đạt hoặc vượt yêu cầu
        } else {
          // Tính điểm theo tỷ lệ (ví dụ: có 3/5 điểm)
          currentScore = candidateLevel / requiredLevel;
        }
        
        if (currentScore > bestMatchScoreForThisSkill) {
          bestMatchScoreForThisSkill = currentScore;
        }
      }
    });

    totalSkillScore += bestMatchScoreForThisSkill;
  });

  return totalSkillScore / jobSkills.length;
};

export const matchCandidateToJob = (job, candidate, candidateSkillsOverride = null,previousJobTitle = []) => {
  const skillsToMatch = candidateSkillsOverride && candidateSkillsOverride.length > 0
    ? candidateSkillsOverride
    : candidate.skills;
  const skillScore = calcSkillMatch(
    job.requiredSkills,
    skillsToMatch
  );

  let titleScore = 0;
  const jobTitleLower = job.title?.toLowerCase(); // Use optional chaining for job.title

  if (jobTitleLower) {
    // Filter out null/undefined titles from previousJobTitle before searching
    const validPreviousJobTitles = previousJobTitle.filter(title => title).map(title => title.toLowerCase());

    if (validPreviousJobTitles.some(prevTitle => prevTitle.includes(jobTitleLower)) ||
        candidate.title?.toLowerCase().includes(jobTitleLower)) {
      titleScore = 1;
    }
  }
  // console.log("Skill Score:", skillScore, "Title Score:", titleScore);
  return {
    percentage: Math.round((0.7 * skillScore + 0.3 * titleScore) * 100),
    detail: {
      skills: Number(skillScore.toFixed(2)),
      title: Number(titleScore.toFixed(2))
    }
  };
};
