const router = require("express").Router();
const referCon = require("../controllers/referCon");


router.get("/list", referCon.getAllRefer);
router.post("/add", referCon.addRefer);
router.post("/update", referCon.updateRefer);



module.exports = router;