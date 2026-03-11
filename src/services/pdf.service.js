const PDFDocument = require("pdfkit")

/**
 * Generates a branded INNVERA kiosk registration certificate PDF
 * Returns a Buffer containing the PDF bytes
 */
exports.generateKioskCertificate = (kioskData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 0, bottom: 0, left: 0, right: 0 }
      })

      const chunks = []
      doc.on("data", (chunk) => chunks.push(chunk))
      doc.on("end", () => resolve(Buffer.concat(chunks)))
      doc.on("error", reject)

      const W = 595.28 // A4 width in points
      const H = 841.89 // A4 height in points
      const ORANGE = "#FF6B47"
      const BLACK = "#000000"
      const WHITE = "#FFFFFF"
      const GREY = "#A3A3A3"

      // ─── Background ───────────────────────────────────────────────────────────
      doc.rect(0, 0, W, H).fill(BLACK)

      // ─── Top accent bar ───────────────────────────────────────────────────────
      doc.rect(0, 0, W, 6).fill(ORANGE)

      // ─── Vertical grid lines (design motif) ───────────────────────────────────
      const lineOpacity = 0.08
      ;[W * 0.166, W * 0.5, W * 0.833].forEach((x) => {
        doc
          .save()
          .opacity(lineOpacity)
          .moveTo(x, 0)
          .lineTo(x, H)
          .lineWidth(0.5)
          .strokeColor(WHITE)
          .stroke()
          .restore()
      })

      // ─── INNVERA wordmark ─────────────────────────────────────────────────────
      doc
        .font("Helvetica-Bold")
        .fontSize(34)
        .fillColor(WHITE)
        .text("INNVERA", 48, 40, { tracking: 4 })

      // ─── Certificate label ────────────────────────────────────────────────────
      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor(GREY)
        .text("KIOSK REGISTRATION CERTIFICATE", 48, 82, { tracking: 3 })

      // ─── Horizontal rule ──────────────────────────────────────────────────────
      doc
        .save()
        .opacity(0.15)
        .moveTo(48, 104)
        .lineTo(W - 48, 104)
        .lineWidth(0.5)
        .strokeColor(WHITE)
        .stroke()
        .restore()

      // ─── Status badge ─────────────────────────────────────────────────────────
      const statusText = kioskData.status || "ACTIVE"
      const badgeColor = statusText === "ACTIVE" ? ORANGE : "#4A4A4A"
      doc.rect(W - 48 - 80, 38, 80, 22).fill(badgeColor)
      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .fillColor(WHITE)
        .text(statusText, W - 48 - 80, 43, { width: 80, align: "center" })

      // ─── Hero section: Kiosk ID ───────────────────────────────────────────────
      doc
        .font("Helvetica-Bold")
        .fontSize(7)
        .fillColor(GREY)
        .text("KIOSK ID", 48, 128)

      doc
        .font("Helvetica-Bold")
        .fontSize(44)
        .fillColor(WHITE)
        .text((kioskData.kioskId || "").toUpperCase(), 48, 140, {
          width: W - 96,
          lineGap: -4
        })

      // ─── Section divider ──────────────────────────────────────────────────────
      const dividerY = 210
      doc
        .save()
        .opacity(0.15)
        .moveTo(48, dividerY)
        .lineTo(W - 48, dividerY)
        .lineWidth(0.5)
        .strokeColor(WHITE)
        .stroke()
        .restore()

      // ─── Details grid (2 columns) ─────────────────────────────────────────────
      const col1X = 48
      const col2X = W / 2 + 12
      const labelSize = 7
      const valueSize = 11
      const rowGap = 38

      const fields = [
        ["OWNER NAME", kioskData.ownerName || "—", col1X, 228],
        ["KIOSK TYPE", kioskData.kioskType || "—", col2X, 228],
        ["PHONE", kioskData.ownerPhone || "—", col1X, 228 + rowGap],
        ["SERVICE TYPE", kioskData.serviceType === "KSS"
          ? "Kiosk Sale Services"
          : kioskData.serviceType === "MKS"
            ? "Managed Kiosk Services"
            : "—", col2X, 228 + rowGap],
        ["EMAIL", kioskData.ownerEmail || "—", col1X, 228 + rowGap * 2],
        ["IP ADDRESS", kioskData.ipAddress || "—", col2X, 228 + rowGap * 2],
        ["ADDRESS", kioskData.address || "—", col1X, 228 + rowGap * 3],
        ["LOCATION", kioskData.locationName || "—", col2X, 228 + rowGap * 3],
        ["LATITUDE", kioskData.geo?.lat?.toString() || "—", col1X, 228 + rowGap * 4],
        ["LONGITUDE", kioskData.geo?.lng?.toString() || "—", col2X, 228 + rowGap * 4]
      ]

      fields.forEach(([label, value, x, y]) => {
        doc
          .font("Helvetica")
          .fontSize(labelSize)
          .fillColor(GREY)
          .text(label, x, y)

        doc
          .font("Helvetica-Bold")
          .fontSize(valueSize)
          .fillColor(WHITE)
          .text(value, x, y + 10, { width: W / 2 - 60, lineBreak: false })
      })

      // ─── Registration date ────────────────────────────────────────────────────
      const regY = 228 + rowGap * 5 + 16
      doc
        .save()
        .opacity(0.15)
        .moveTo(48, regY - 8)
        .lineTo(W - 48, regY - 8)
        .lineWidth(0.5)
        .strokeColor(WHITE)
        .stroke()
        .restore()

      doc
        .font("Helvetica")
        .fontSize(7)
        .fillColor(GREY)
        .text("REGISTRATION DATE", 48, regY)

      const regDate = kioskData.createdAt
        ? new Date(kioskData.createdAt).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "long",
            day: "numeric"
          })
        : new Date().toLocaleDateString("en-IN", {
            year: "numeric",
            month: "long",
            day: "numeric"
          })

      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor(WHITE)
        .text(regDate, 48, regY + 10)

      // ─── Certificate number ───────────────────────────────────────────────────
      doc
        .font("Helvetica")
        .fontSize(7)
        .fillColor(GREY)
        .text("CERTIFICATE NO.", col2X, regY)

      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor(WHITE)
        .text(
          `INN-${(kioskData.kioskId || "").toUpperCase()}-${new Date().getFullYear()}`,
          col2X,
          regY + 10
        )

      // ─── Login instruction box ─────────────────────────────────────────────────
      const boxY = H - 200
      doc.rect(48, boxY, W - 96, 80).fill("#111111")
      doc.rect(48, boxY, 4, 80).fill(ORANGE)

      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor(ORANGE)
        .text("HOW TO ACCESS YOUR DASHBOARD", 62, boxY + 14)

      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor(WHITE)
        .text(
          `Visit your kiosk dashboard at the URL provided by INNVERA. Sign in with Kiosk ID: "${kioskData.kioskId}" and your registered password.`,
          62,
          boxY + 30,
          { width: W - 128 }
        )

      // ─── Footer ───────────────────────────────────────────────────────────────
      doc.rect(0, H - 72, W, 72).fill("#0a0a0a")
      doc
        .save()
        .opacity(0.15)
        .moveTo(0, H - 72)
        .lineTo(W, H - 72)
        .lineWidth(0.5)
        .strokeColor(WHITE)
        .stroke()
        .restore()

      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor(WHITE)
        .text("INNVERA", 48, H - 52)

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor(GREY)
        .text("innvera.co  ·  support@innvera.co  ·  This document is auto-generated and officially valid.", 48, H - 38, {
          width: W - 96
        })

      doc.end()
    } catch (err) {
      reject(err)
    }
  })
}
