import * as authService from "../services/auth.service.js";

export const register = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.register({ email, password });

    res.status(201).json({
      message: "Register successfully",
      data: result
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });

    res.json({
      message: "Login successfully",
      data: result
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Missing token" });
    }

    const result = await authService.googleLogin({ idToken: token });

    res.json({
      message: "Google login successful",
      data: result
    });
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
};
