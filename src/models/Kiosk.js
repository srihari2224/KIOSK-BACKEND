const mongoose = require("mongoose")

const kioskSchema = new mongoose.Schema(
  {
    kioskId: { type: String, unique: true },
    username: { type: String, unique: true },
    passwordHash: String,

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
