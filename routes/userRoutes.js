const router = require("express").Router();
const userCon = require("../controllers/userCon");

router.get("/list", userCon.getAllUsers); // ดึงรายชื่อ User พร้อมสังกัด
router.post("/find", userCon.getUserByUsername);    // หา username
router.post("/add", userCon.addUser);    // เพิ่ม User
router.post("/del", userCon.delUser);    // ลบข้อมูล User
router.post("/updateuser", userCon.updateUser); // Update User
module.exports = router;