import { verifyToken } from "../utils/jwt.js";

export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    req.user = decoded; // { userId, roles }
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};
