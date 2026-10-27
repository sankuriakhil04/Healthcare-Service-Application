const jwt = require("jsonwebtoken");
function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token)
    return res
      .status(401)
      .json({ success: false, message: "Please log in to continue." });
  try {
    req.user = jwt.verify(
      token,
      process.env.JWT_SECRET || "careconnect-local-demo-secret-change-me",
    );
    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Your session has expired. Please log in again.",
    });
  }
}
module.exports = authMiddleware;
