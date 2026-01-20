const Kiosk = require("../models/Kiosk")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

exports.login = async (req, res) => {
  const { username, password, deviceId } = req.body

  const kiosk = await Kiosk.findOne({ username })
  if (!kiosk) return res.status(400).json({ error: "Invalid login" })

  if (kiosk.status !== "ACTIVE")
    return res.status(403).json({ error: "Kiosk not approved yet" })

  const ok = await bcrypt.compare(password, kiosk.passwordHash)
  if (!ok) return res.status(400).json({ error: "Invalid login" })

  kiosk.deviceId = deviceId
  await kiosk.save()

  const token = jwt.sign(
    { kioskId: kiosk.kioskId },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  )

  res.json({
    success: true,
    token,
    kioskId: kiosk.kioskId,
    locationName: kiosk.locationName
  })
}
