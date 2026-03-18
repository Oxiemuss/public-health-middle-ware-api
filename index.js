const express = require('express');
const cors = require('cors');
const healthRoutes = require("./routes/healthRoutes");
const userRoutes = require("./routes/userRoutes");
const referRouters = require("./routes/referRoutes");

const app = express();

app.use(cors());
app.use(express.json());


app.get("/", (req, res) => {
    res.send("Public Health Middleware API is running...");
});
// เรียกใช้งาน Routes ทั้งหมด
app.use("/api/healthcenter", healthRoutes);
app.use("/api/users", userRoutes);
app.use("/api/refer", referRouters);


if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5500;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

// Export app เพื่อให้ Vercel เอาไปใช้งานแบบ Serverless
module.exports = app;