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

    bankDetails: {
      accountName: String,
      accountNumber: String,
      ifscCode: String,
      bankName: String
    },

    settlements: [{
      amount: Number,
      transactionId: String,
      proofImage: String, // base64
      fromDate: Date,
      toDate: Date,
      status: {
        type: String,
        enum: ["PENDING", "APPROVED", "REJECTED"],
        default: "PENDING"
      },
      createdAt: { type: Date, default: Date.now }
    }],

    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "BLOCKED", "REJECTED"],
      default: "PENDING"
    }
  },
  { timestamps: true }
)

module.exports = mongoose.model("Kiosk", kioskSchema)
