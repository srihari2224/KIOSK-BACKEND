const express = require("express")
const router = express.Router()
const { verifyOtp, downloadFile } = require("../controllers/otp.controller")

router.post("/verify", verifyOtp)
router.get("/download/:uploadId", downloadFile)

module.exports = router
