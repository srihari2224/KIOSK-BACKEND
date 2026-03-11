const router = require("express").Router()
const controller = require("../controllers/kiosk.controller")

router.post("/register", controller.registerKiosk)
router.get("/approve", controller.approveKiosk)
router.get("/list", controller.listKiosks)
router.get("/:kioskId/certificate", controller.downloadCertificate)
router.get("/:kioskId", controller.getKiosk)

module.exports = router
