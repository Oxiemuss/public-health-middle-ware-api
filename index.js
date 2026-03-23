const express = require('express');
const cors = require('cors');
const healthRoutes = require("./routes/healthRoutes");
const userRoutes = require("./routes/userRoutes");
const referRouters = require("./routes/referRoutes");

const app = express();

// --- 1. การตั้งค่า Middleware (รวม CORS ไว้ที่เดียว) ---
app.use(cors({
  origin: ['http://localhost:4200', 'https://your-frontend-domain.vercel.app'], // เพิ่ม URL หน้าบ้านของคุณที่นี่
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());

// --- 2. Routes ---
app.get("/", (req, res) => {
    res.send("Public Health Middleware API is running...");
});

app.use("/api/healthcenter", healthRoutes);
app.use("/api/users", userRoutes);
app.use("/api/refer", referRouters);

// --- 3. การจัดการ Port สำหรับ Local Development ---
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5500;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

// --- 4. Export สำหรับ Vercel ---
module.exports = app;