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

// Delete
router.post("/:kioskId/request-delete", controller.requestDelete)
router.delete("/:kioskId", controller.confirmDelete)

// Pricing
router.get("/:kioskId/pricing", controller.getPricing)
router.put("/:kioskId/pricing", controller.updatePricing)

// Paper & Printer config
router.put("/:kioskId/paper", controller.updatePaper)
router.post("/:kioskId/paper/reset", controller.resetPaper)
router.put("/:kioskId/printer-config", controller.updatePrinterConfig)

router.get("/:kioskId", controller.getKiosk)

module.exports = router
