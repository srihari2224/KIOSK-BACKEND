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
    cpuUsername: String,
    cpuPassword: String,
    printer1Capacity: Number,
    printer2Capacity: Number,
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
      enum: ["PENDING", "ACTIVE", "BLOCKED", "REJECTED", "DELETE_PENDING"],
      default: "PENDING"
    },

    // Printer routing: SX = single printer, DX = dual printer
    kioskVariant: { type: String, enum: ["SX", "DX"], default: "SX" },
    printer1: { type: String, default: "" },
    printer2: { type: String, default: "" },

    // Paper tracking (sheets remaining)
    printer1Paper: { type: Number, default: 250 },
    printer2Paper: { type: Number, default: 250 },

    // Per-kiosk pricing (₹ per page/sheet)
    pricing: {
      colorRate:    { type: Number, default: 8 },
      bwSingleRate: { type: Number, default: 2 },
      bwDuplexRate: { type: Number, default: 3 }
    }
  },
  { timestamps: true }
)

module.exports = mongoose.model("Kiosk", kioskSchema)
