const router = require("express").Router();
const referCon = require("../controllers/referCon");
const multer = require('multer');


const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // จำกัดขนาดไฟล์ 5MB
});

router.get("/list", referCon.getAllRefer);
router.post("/update", referCon.updateRefer);
router.post("/del", referCon.delRefer);
router.post('/add', upload.fields([
  { name: 'refer_pic', maxCount: 1 },
  { name: 'cid_card_pic', maxCount: 1 }
]), referCon.addRefer);



module.exports = router;