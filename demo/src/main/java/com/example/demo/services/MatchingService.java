package com.example.demo.services;

import com.example.demo.models.Candidate;
import com.example.demo.models.Job;
import com.example.demo.models.Skill;
import com.example.demo.models.SkillLevel;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class MatchingService {

    private static final Map<SkillLevel, Integer> LEVEL_MAP = Map.of(
            SkillLevel.BASIC, 1,
            SkillLevel.INTERMEDIATE, 2,
            SkillLevel.ADVANCED, 3,
            SkillLevel.PROFICIENT, 4,
            SkillLevel.EXPERT, 5
    );

    private static final Map<Job.JobLevel, Integer> JOB_LEVEL_MAP = Map.of(
            Job.JobLevel.INTERN, 1,
            Job.JobLevel.FRESHER, 2,
            Job.JobLevel.JUNIOR, 3,
            Job.JobLevel.MID, 4,
            Job.JobLevel.SENIOR, 5
    );

    private double calculateSkillMatch(List<Skill> jobSkills, List<Skill> candidateSkills) {
        if (jobSkills == null || jobSkills.isEmpty()) {
            return 1.0;
        }
        if (candidateSkills == null || candidateSkills.isEmpty()) {
            return 0.0;
        }

        double totalSkillScore = 0;

        for (Skill jobSkill : jobSkills) {
            String jobSkillNameLower = jobSkill.getName().toLowerCase().trim();
            int requiredLevel = LEVEL_MAP.getOrDefault(jobSkill.getLevel(), 1);

            double bestMatchScoreForThisSkill = 0;

            for (Skill candidateSkill : candidateSkills) {
                String candidateSkillNameLower = candidateSkill.getName().toLowerCase().trim();
                int candidateLevel = LEVEL_MAP.getOrDefault(candidateSkill.getLevel(), 1);

                boolean nameMatch = candidateSkillNameLower.contains(jobSkillNameLower) || jobSkillNameLower.contains(candidateSkillNameLower);

                if (nameMatch) {
                    double currentScore;
                    if (candidateLevel >= requiredLevel) {
                        currentScore = 1;
                    } else {
                        currentScore = (double) candidateLevel / requiredLevel;
                    }

                    if (currentScore > bestMatchScoreForThisSkill) {
                        bestMatchScoreForThisSkill = currentScore;
                    }
                }
            }

            totalSkillScore += bestMatchScoreForThisSkill;
        }

        return totalSkillScore / jobSkills.size();
    }

    public MatchResult matchCandidateToJob(Job job, Candidate candidate, List<Skill> candidateSkillsOverride, List<String> previousJobTitles) {
        List<Skill> skillsToMatch = (candidateSkillsOverride != null && !candidateSkillsOverride.isEmpty())
                ? candidateSkillsOverride
                : candidate.getSkills();

        double skillScore = calculateSkillMatch(job.getRequiredSkills(), skillsToMatch);

        double titleScore = 0;
        if (job.getTitle() != null) {
            String jobTitleLower = job.getTitle().toLowerCase();
            List<String> validPreviousJobTitles = previousJobTitles.stream()
                    .filter(title -> title != null && !title.isEmpty())
                    .map(String::toLowerCase)
                    .collect(Collectors.toList());

            if (validPreviousJobTitles.stream().anyMatch(prevTitle -> prevTitle.contains(jobTitleLower)) ||
                    (candidate.getTitle() != null && candidate.getTitle().toLowerCase().contains(jobTitleLower))) {
                titleScore = 1;
            }
        }

        return new MatchResult(
                Math.round((0.7 * skillScore + 0.3 * titleScore) * 100),
                new MatchResult.MatchDetail(skillScore, titleScore)
        );
    }

    public static class MatchResult {
        private final long percentage;
        private final MatchDetail detail;

        public MatchResult(long percentage, MatchDetail detail) {
            this.percentage = percentage;
            this.detail = detail;
        }

        public long getPercentage() {
            return percentage;
        }

        public MatchDetail getDetail() {
            return detail;
        }

        public static class MatchDetail {
            private final double skills;
            private final double title;

            public MatchDetail(double skills, double title) {
                this.skills = skills;
                this.title = title;
            }

            public double getSkills() {
                return skills;
            }

            public double getTitle() {
                return title;
            }
        }
    }
}
