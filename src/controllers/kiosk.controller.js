const bcrypt = require("bcryptjs")
const { v4: uuid } = require("uuid")
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

    const passwordHash = await bcrypt.hash(password, 10)
    const kioskId = uuid()
    const token = uuid()

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

    await sendApprovalMail({ ownerEmail, kioskId, token })

    res.json({
      success: true,
      message: "Registration submitted. Waiting for approval."
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}

exports.approveKiosk = async (req, res) => {
  const { kioskId } = req.query

  const kiosk = await Kiosk.findOne({ kioskId })
  if (!kiosk) return res.send("Invalid kiosk")

  kiosk.status = "ACTIVE"
  await kiosk.save()

  res.send("Kiosk approved successfully. You can login now.")
}
