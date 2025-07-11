const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
    const token = req.headers["authorization"];

    console.log("🔍 Token received:", token);

    if (!token) {
        return res.status(401).json({ error: "No token provided" });
    }

    jwt.verify(token.split(" ")[1], process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.error("❌ JWT verification error:", err);
            return res.status(403).json({ error: "Invalid token" });
        }

        console.log("✅ Decoded token:", decoded);

        // Accept both 'id' and 'userId'
        const userId = decoded.id || decoded.userId;
        if (!userId) {
            console.error("❌ Token does not contain user ID");
            return res.status(403).json({ error: "Token does not contain valid user ID" });
        }

        req.user = { ...decoded, id: userId }; // Always set req.user.id
        next();
    });
};

module.exports = { authenticateToken };