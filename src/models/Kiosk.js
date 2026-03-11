const mongoose = require("mongoose")

const kioskSchema = new mongoose.Schema(
  {
    kioskId: { type: String, unique: true },
    username: { type: String, unique: true },
    passwordHash: String,

    // Extended registration fields
    kioskType: { type: String, enum: ["SX-Series", "DX-Series"] },
    serviceType: { type: String, enum: ["KSS", "MKS"] },
    ipAddress: String,
    ownerName: String,
    ownerPhone: String,

    locationName: String,
    address: String,
    geo: {
      lat: Number,
      lng: Number
    },

    ownerEmail: String,
    deviceId: String,

    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "BLOCKED"],
      default: "PENDING"
    }
  },
  { timestamps: true }
)

module.exports = mongoose.model("Kiosk", kioskSchema)
