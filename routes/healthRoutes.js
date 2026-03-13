const router = require("express").Router();
const healthCon = require("../controllers/healthCon");

// router.get("/", healthCon.getAllHealthCenters); // ดึงทั้งหมด
router.post("/add", healthCon.addHealthCenter);    // เพิ่มหน่วยบริการ
module.exports = router;