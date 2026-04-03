const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(403).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    // เพิ่มบรรทัดนี้เพื่อดูว่า Server บ่นว่าอะไร (ใน Console)
    console.log("❌ Token Error:", err.message); 
    return res.status(401).json({ error: "Invalid or Expired Token", detail: err.message });
  }
};

module.exports = verifyToken;
