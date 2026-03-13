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
      cpuUsername,
      cpuPassword,
      printer1Capacity,
      printer2Capacity,
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
      cpuUsername,
      cpuPassword,
      printer1Capacity: printer1Capacity ? Number(printer1Capacity) : undefined,
      printer2Capacity: printer2Capacity ? Number(printer2Capacity) : undefined,
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

exports.rejectKiosk = async (req, res) => {
  const { kioskId } = req.query

  const kiosk = await Kiosk.findOne({ kioskId })
  if (!kiosk) return res.send("Invalid kiosk")

  kiosk.status = "REJECTED"
  await kiosk.save()

  res.send(`<html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#050505;color:#fff;border:1px solid #222"><h1 style="color:#ff4444;font-size:24px;text-transform:uppercase;letter-spacing:-1px;margin-bottom:8px">Rejected</h1><p style="color:#a3a3a3;font-size:14px">Kiosk "${kiosk.username}" has been rejected.</p></body></html>`)
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

exports.updateBankDetails = async (req, res) => {
  try {
    const { kioskId } = req.params;
    const { bankDetails } = req.body;

    const kiosk = await Kiosk.findOne({ kioskId });
    if (!kiosk) return res.status(404).json({ error: "Kiosk not found" });

    kiosk.bankDetails = bankDetails;
    await kiosk.save();

    res.json({ success: true, message: "Bank details updated", bankDetails: kiosk.bankDetails });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

exports.addSettlement = async (req, res) => {
  try {
    const { kioskId } = req.params;
    const { amount, transactionId, proofImage, fromDate, toDate } = req.body;

    const kiosk = await Kiosk.findOne({ kioskId });
    if (!kiosk) return res.status(404).json({ error: "Kiosk not found" });

    kiosk.settlements.push({
      amount,
      transactionId,
      proofImage,
      fromDate,
      toDate,
      status: "PENDING"
    });

    await kiosk.save();

    const { sendSettlementApprovalMail } = require("../services/email.service");
    const newSettlement = kiosk.settlements[kiosk.settlements.length - 1];
    await sendSettlementApprovalMail(kiosk.toObject(), newSettlement);

    res.json({ success: true, message: "Settlement added. Awaiting admin approval.", settlements: kiosk.settlements });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

exports.approveSettlement = async (req, res) => {
  try {
    const { kioskId, settlementId } = req.params;

    const kiosk = await Kiosk.findOne({ kioskId });
    if (!kiosk) return res.send("Invalid kiosk");

    const settlement = kiosk.settlements.id(settlementId);
    if (!settlement) return res.send("Invalid settlement");

    settlement.status = "APPROVED";
    await kiosk.save();

    const { sendSettlementInvoiceMail } = require("../services/email.service");
    await sendSettlementInvoiceMail(kiosk.toObject(), settlement);

    res.send(`<html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#000;color:#fff"><h1 style="color:#ff6b47">INNVERA</h1><h2>Settlement Approved!</h2><p style="color:#a3a3a3">An invoice has been successfully sent to the owner.</p></body></html>`);
  } catch (e) {
    console.error("Error approving settlement:", e);
    res.status(500).send("Error approving settlement.");
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