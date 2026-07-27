import jwt from "jsonwebtoken";

// user authentication middleware
const authUser = async (req, res, next) => {
  try {
    let token =
      req.headers.token ||
      req.headers.authorization ||
      req.headers.Authorization ||
      req.headers["x-access-token"];

    if (!token) {
      return res.json({
        success: false,
        message: "Not Authorized. Please log in again.",
      });
    }

    if (typeof token === "string" && token.startsWith("Bearer ")) {
      token = token.slice(7).trim();
    }

    const token_decode = jwt.verify(
      token,
      process.env.JWT_SECRET || "dev_jwt_secret"
    );

    req.userId = token_decode.id;
    req.body = req.body || {};
    req.body.userId = token_decode.id;
    next();
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export default authUser;
