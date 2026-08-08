export const requireRecruiter = (req, res, next) => {
  if (!req.user.roles?.recruiter) {
    console.log("User roles:", req.user); // Debug log to check user roles
    return res.status(403).json({
      message: "Recruiter role required"
    });
  }
  next();
};

export const requireCandidate = (req, res, next) => {
  if (!req.user.roles?.candidate) {
    return res.status(403).json({
      message: "Candidate role required"
    });
  }
  next();
};
