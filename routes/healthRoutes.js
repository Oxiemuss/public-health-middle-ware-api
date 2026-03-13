const router = require("express").Router();
const healthCon = require("../controllers/healthCon");

router.post("/add", healthCon.addHealthCenter);    
router.get("/list", healthCon.getAllHealthCenters);
router.post("/info", healthCon.getHealthCenterById);

module.exports = router;