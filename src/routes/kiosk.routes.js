const router = require("express").Router()
const controller = require("../controllers/kiosk.controller")

router.post("/register", controller.registerKiosk)
router.get("/approve", controller.approveKiosk)

module.exports = router
