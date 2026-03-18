const router = require("express").Router();
const referCon = require("../controllers/referCon");


router.get("/list", referCon.getAllRefer);
router.post("/add", referCon.addRefer);
router.post("/update", referCon.updateRefer);
router.post("/del", referCon.delRefer);



module.exports = router;