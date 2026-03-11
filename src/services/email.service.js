const AWS = require("aws-sdk")
const { generateKioskCertificate } = require("./pdf.service")

const ses = new AWS.SES({
  region: process.env.AWS_REGION || "ap-south-1",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
})

exports.sendApprovalMail = async ({ ownerEmail, kioskId, username }) => {
  const url = `${process.env.BASE_URL}/api/kiosk/approve?kioskId=${kioskId}`

  const params = {
    Source: process.env.SES_FROM_EMAIL || "innvera.co@gmail.com",
    Destination: {
      ToAddresses: ["msrihari2224@gmail.com"] // Admin receives approval link
    },
    Message: {
      Subject: { Data: `[INNVERA] New Kiosk Registration — ${username}` },
      Body: {
        Html: {
          Data: `
            <div style="background:#000;color:#fff;font-family:sans-serif;padding:40px;max-width:600px">
              <h1 style="color:#ff6b47;font-size:28px;letter-spacing:-1px;margin:0 0 8px">INNVERA</h1>
              <p style="color:#a3a3a3;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:0 0 32px">Kiosk Registration Request</p>
              <h2 style="font-size:18px;margin:0 0 24px">New kiosk registered: <strong>${username}</strong></h2>
              <p style="color:#a3a3a3">Owner Email: ${ownerEmail}</p>
              <p style="color:#a3a3a3">Kiosk ID: ${kioskId}</p>
              <br/>
              <a href="${url}" style="background:#ff6b47;color:#fff;padding:14px 28px;text-decoration:none;display:inline-block;font-weight:bold;letter-spacing:1px;text-transform:uppercase">
                APPROVE KIOSK
              </a>
              <br/><br/>
              <p style="color:#4a4a4a;font-size:12px">Or copy: ${url}</p>
            </div>
          `
        }
      }
    }
  }

  try {
    await ses.sendEmail(params).promise()
    console.log(`Approval email sent for ${username}`)
  } catch (error) {
    console.error("Approval email error:", error.message)
  }
}

exports.sendCertificateMail = async (kioskData) => {
  try {
    const pdfBuffer = await generateKioskCertificate(kioskData)

    const boundary = `boundary_${Date.now()}`
    const rawEmail = [
      `From: INNVERA <${process.env.SES_FROM_EMAIL || "innvera.co@gmail.com"}>`,
      `To: ${kioskData.ownerEmail}`,
      `Subject: [INNVERA] Your Kiosk Registration Certificate — ${kioskData.kioskId}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      ``,
      `--${boundary}`,
      `Content-Type: text/html; charset=UTF-8`,
      ``,
      `<div style="background:#000;color:#fff;font-family:sans-serif;padding:40px;max-width:600px">
        <h1 style="color:#ff6b47;font-size:28px;letter-spacing:-1px;margin:0 0 8px">INNVERA</h1>
        <p style="color:#a3a3a3;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:0 0 32px">Kiosk Registration Approved</p>
        <h2 style="font-size:20px;margin:0 0 16px">Congratulations, ${kioskData.ownerName || kioskData.username}!</h2>
        <p>Your kiosk <strong style="color:#ff6b47">${kioskData.kioskId}</strong> has been approved and is now active.</p>
        <p style="color:#a3a3a3">Please find your official INNVERA registration certificate attached to this email.</p>
        <p style="color:#a3a3a3">Use your Kiosk ID and registered password to access your owner dashboard.</p>
        <br/>
        <p style="color:#4a4a4a;font-size:12px">INNVERA · innvera.co · support@innvera.co</p>
      </div>`,
      ``,
      `--${boundary}`,
      `Content-Type: application/pdf`,
      `Content-Transfer-Encoding: base64`,
      `Content-Disposition: attachment; filename="innvera-kiosk-${kioskData.kioskId}.pdf"`,
      ``,
      pdfBuffer.toString("base64"),
      ``,
      `--${boundary}--`
    ].join("\r\n")

    const params = {
      RawMessage: { Data: Buffer.from(rawEmail) },
      Destinations: [kioskData.ownerEmail],
      Source: process.env.SES_FROM_EMAIL || "innvera.co@gmail.com"
    }

    await ses.sendRawEmail(params).promise()
    console.log(`Certificate email sent to ${kioskData.ownerEmail}`)
  } catch (error) {
    console.error("Certificate email error:", error.message)
  }
}