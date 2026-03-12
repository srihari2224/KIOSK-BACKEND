const router = require("express").Router()
const controller = require("../controllers/kiosk.controller")

router.post("/register", controller.registerKiosk)
router.get("/approve", controller.approveKiosk)
router.get("/reject", controller.rejectKiosk)
router.get("/list", controller.listKiosks)
router.put("/:kioskId/bank", controller.updateBankDetails)
router.post("/:kioskId/settlement", controller.addSettlement)
router.get("/:kioskId/settlement/:settlementId/approve", controller.approveSettlement)
router.get("/:kioskId/certificate", controller.downloadCertificate)
router.get("/:kioskId", controller.getKiosk)

module.exports = router
