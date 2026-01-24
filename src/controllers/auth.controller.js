const Kiosk = require("../models/Kiosk")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

exports.login = async (req, res) => {
  try {
    const { username, password, deviceId } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" })
    }

    const kiosk = await Kiosk.findOne({ username })
    if (!kiosk) {
      return res.status(400).json({ error: "Invalid credentials" })
    }

    if (kiosk.status !== "ACTIVE") {
      return res.status(403).json({ error: "Kiosk not approved yet. Check your email for approval link." })
    }

    const ok = await bcrypt.compare(password, kiosk.passwordHash)
    if (!ok) {
      return res.status(400).json({ error: "Invalid credentials" })
    }

    // Update deviceId if provided
    if (deviceId) {
      kiosk.deviceId = deviceId
      await kiosk.save()
    }

    const token = jwt.sign(
      { kioskId: kiosk.kioskId, username: kiosk.username },
      process.env.JWT_SECRET || "your-secret-key-change-in-production",
      { expiresIn: "30d" }
    )

    res.json({
      success: true,
      token,
      kioskId: kiosk.username,  // Return username as kioskId
      username: kiosk.username,
      locationName: kiosk.locationName
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ error: "Login failed" })
  }
}