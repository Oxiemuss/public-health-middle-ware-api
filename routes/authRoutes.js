const router =require("express").Router();
const authCon = require("../controllers/authCon");

router.post("/register", authCon.register);
router.post("/login", authCon.login);


module.exports = router;