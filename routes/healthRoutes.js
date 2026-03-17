const router = require("express").Router();
const healthCon = require("../controllers/healthCon");

router.get("/list", healthCon.getAllHealthCenters);
router.post("/add", healthCon.addHealthCenter);    
router.post("/info", healthCon.getHealthCenterById);
router.post("/updatehc", healthCon.updateHealthCenter);
router.post("/del", healthCon.delHealthCenter);
module.exports = router;