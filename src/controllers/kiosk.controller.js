const bcrypt = require("bcryptjs")
const Kiosk = require("../models/Kiosk")
const { sendApprovalMail } = require("../services/email.service")

exports.registerKiosk = async (req, res) => {
  try {
    const {
      username,
      password,
      locationName,
      address,
      lat,
      lng,
      ownerEmail,
      deviceId
    } = req.body

    if (!username || !password || !ownerEmail)
      return res.status(400).json({ error: "Missing fields" })

    // Check if username already exists
    const existing = await Kiosk.findOne({ username })
    if (existing) {
      return res.status(400).json({ error: "Username already taken" })
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_-]+$/
    if (!usernameRegex.test(username)) {
      return res.status(400).json({ 
        error: "Username can only contain letters, numbers, dash and underscore" 
      })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    
    // Use username as kioskId
    const kioskId = username

    await Kiosk.create({
      kioskId,
      username,
      passwordHash,
      locationName,
      address,
      geo: { lat, lng },
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

  res.send(`Kiosk "${kiosk.username}" approved successfully. You can login now.`)
}