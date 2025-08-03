const loginService = require("../services/login.service");
const jwt = require("jsonwebtoken");
const jwtSecret = process.env.JWT_SECRET || "your_jwt_secret";

async function logIn(req, res) {
  try {
    const { email, password } = req.body;
    const user = await loginService.logIn({ email, password });

    if (user.status === "fail") {
      return res.status(403).json({ status: "fail", message: user.message });
    }

    const payload = {
      user_id: user.data.user_id,
      email: user.data.email,
      first_name: user.data.first_name,
      last_name: user.data.last_name,
      role: user.data.company_role_name,
    };

    const token = jwt.sign(payload, jwtSecret, { expiresIn: "24h" });

    return res.status(200).json({
      status: "success",
      message: "User logged in successfully",
      data: {
        user_token: token,
        user_info: payload,
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
}

module.exports = { logIn };
