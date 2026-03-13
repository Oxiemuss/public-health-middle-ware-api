const router = require("express").Router();
const userCon = require("../controllers/userCon");

router.get("/list", userCon.getAllUsers); // ดึงรายชื่อ User พร้อมสังกัด
router.post("/add", userCon.addUser);    // เพิ่ม User
module.exports = router;