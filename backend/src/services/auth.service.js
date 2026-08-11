import { verifyGoogleToken } from "./googleAuth.service.js";
import User from "../models/User.model.js";
import Candidate from "../models/Candidate.model.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { signToken } from "../utils/jwt.js";

export const register = async ({ email, password }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error("Email already exists");
  }

  const hashedPassword = await hashPassword(password);

  const user = await User.create({
    email,
    password: hashedPassword,
    provider: "local",
    roles: { candidate: true, recruiter: false }
  });

  const token = signToken({
    userId: user._id,
    roles: user.roles
  });

  return { user, token };
};

export const login = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user || !user.password) {
    throw new Error("Invalid credentials");
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  const token = signToken({
    userId: user._id,
    roles: user.roles
  });

  return { user, token };
};

export const googleLogin = async ({ idToken }) => {
  const googleUser = await verifyGoogleToken(idToken);

  if (!googleUser.emailVerified) {
    throw new Error("Google email is not verified");
  }

  let user = await User.findOne({
    email: googleUser.email,
  });

  if (!user) {
    user = await User.create({
      email: googleUser.email,
      provider: "google",
      providerId: googleUser.providerId,
      roles: {
        candidate: true,
        recruiter: false
      }
    });

    await Candidate.create({
      userId: user._id,
      fullName: googleUser.name
    });
  }

  const token = signToken({
    userId: user._id,
    roles: user.roles
  });

  return { user, token };
};
