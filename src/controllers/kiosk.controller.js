const bcrypt = require("bcryptjs")
const Kiosk = require("../models/Kiosk")
const { sendApprovalMail, sendCertificateMail } = require("../services/email.service")

exports.registerKiosk = async (req, res) => {
  try {
    const {
      username,
      password,
      kioskType,
      serviceType,
      ipAddress,
      ownerName,
      ownerPhone,
      locationName,
      address,
      lat,
      lng,
      ownerEmail,
      deviceId
    } = req.body

    if (!username || !password || !ownerEmail || !lat || !lng)
      return res.status(400).json({ error: "Missing fields" })

    const latitude = parseFloat(lat)
    const longitude = parseFloat(lng)

    if (isNaN(latitude) || isNaN(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ error: "Invalid latitude or longitude" })
    }

    const existing = await Kiosk.findOne({ username })
    if (existing) {
      return res.status(400).json({ error: "Username already taken" })
    }

    const usernameRegex = /^[a-zA-Z0-9_-]+$/
    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        error: "Username can only contain letters, numbers, dash and underscore"
      })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const kioskId = username

    await Kiosk.create({
      kioskId,
      username,
      passwordHash,
      kioskType,
      serviceType,
      ipAddress,
      ownerName,
      ownerPhone,
      locationName,
      address,
      geo: { lat: latitude, lng: longitude },
      ownerEmail,
      deviceId,
      status: "PENDING"
    })

    await sendApprovalMail({ ownerEmail, kioskId, username })

    res.json({
      success: true,
      message: "Registration submitted. Waiting for approval.",
      kioskId: username
    })
  } catch (e) {
    console.error("Registration error:", e)
    res.status(500).json({ error: e.message })
  }
}

exports.approveKiosk = async (req, res) => {
  const { kioskId } = req.query

  const kiosk = await Kiosk.findOne({ kioskId })
  if (!kiosk) return res.send("Invalid kiosk")

  kiosk.status = "ACTIVE"
  await kiosk.save()

  // Send certificate email
  try {
    await sendCertificateMail(kiosk.toObject())
  } catch (e) {
    console.error("Certificate email error:", e)
  }

  res.send(`<html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#000;color:#fff"><h1 style="color:#ff6b47">INNVERA</h1><h2>Kiosk "${kiosk.username}" approved successfully.</h2><p style="color:#a3a3a3">The owner has been notified via email with their registration certificate.</p></body></html>`)
}

exports.listKiosks = async (req, res) => {
  try {
    const kiosks = await Kiosk.find({}, "-passwordHash").sort({ createdAt: -1 })
    res.json({ success: true, kiosks })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}

exports.getKiosk = async (req, res) => {
  try {
    const kiosk = await Kiosk.findOne({ kioskId: req.params.kioskId }, "-passwordHash")
    if (!kiosk) return res.status(404).json({ error: "Kiosk not found" })
    res.json({ success: true, kiosk })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}

exports.downloadCertificate = async (req, res) => {
  try {
    const { generateKioskCertificate } = require("../services/pdf.service")
    const kiosk = await Kiosk.findOne({ kioskId: req.params.kioskId }, "-passwordHash")
    if (!kiosk) return res.status(404).json({ error: "Kiosk not found" })

    const pdfBuffer = await generateKioskCertificate(kiosk.toObject())

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="innvera-kiosk-${kiosk.kioskId}.pdf"`,
      "Content-Length": pdfBuffer.length
    })
    res.send(pdfBuffer)
  } catch (e) {
    console.error("PDF generation error:", e)
    res.status(500).json({ error: e.message })
  }
}