const express = require('express');
const cors = require('cors');
const healthRoutes = require("./routes/healthRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// เรียกใช้งาน Routes ทั้งหมด
app.use("/api/healthcenter", healthRoutes);
app.use("/api/users", userRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});