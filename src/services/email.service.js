const AWS = require("aws-sdk")
const { generateKioskCertificate } = require("./pdf.service")

const ses = new AWS.SES({
  region: process.env.AWS_REGION || "ap-south-1",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
})

exports.sendApprovalMail = async (kioskData) => {
  const { ownerEmail, kioskId, username } = kioskData;
  const urlApprove = `${process.env.BASE_URL}/api/kiosk/approve?kioskId=${kioskId}`
  const urlReject = `${process.env.BASE_URL}/api/kiosk/reject?kioskId=${kioskId}`
  
  try {
    const pdfBuffer = await generateKioskCertificate(kioskData)

    const boundary = `boundary_${Date.now()}`
    const rawEmail = [
      `From: INNVERA <${process.env.SES_FROM_EMAIL || "innvera.co@gmail.com"}>`,
      `To: msrihari2224@gmail.com`,
      `Subject: [Action Required] INNVERA Kiosk Registration — ${username}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      ``,
      `--${boundary}`,
      `Content-Type: text/html; charset=UTF-8`,
      ``,
      `<div style="background:#0a0a0a;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,sans-serif;padding:40px;max-width:600px;border:1px solid #333">
        <h1 style="color:#ff6b47;font-size:24px;letter-spacing:-1px;margin:0 0 8px;font-weight:900;text-transform:uppercase">INNVERA</h1>
        <p style="color:#a3a3a3;font-size:10px;font-family:monospace;letter-spacing:2px;text-transform:uppercase;margin:0 0 32px;display:inline-block;border-bottom:1px solid #333;padding-bottom:4px">
          Kiosk Registration Request
        </p>
        <h2 style="font-size:20px;font-weight:900;margin:0 0 20px;text-transform:uppercase;letter-spacing:-0.5px">
          Pending Approval: ${username}
        </h2>
        
        <div style="background:#111;border:1px solid #222;padding:16px;margin-bottom:24px">
          <p style="margin:0 0 8px;font-size:14px"><span style="color:#666;text-transform:uppercase;font-size:10px;letter-spacing:1px;margin-right:12px">Owner</span> ${ownerEmail}</p>
          <p style="margin:0 0 8px;font-size:14px"><span style="color:#666;text-transform:uppercase;font-size:10px;letter-spacing:1px;margin-right:12px">Kiosk ID</span> ${kioskId}</p>
          <p style="margin:0;font-size:14px"><span style="color:#666;text-transform:uppercase;font-size:10px;letter-spacing:1px;margin-right:12px">Name</span> ${username}</p>
        </div>

        <p style="color:#a3a3a3;font-size:13px;line-height:1.5;margin-bottom:32px">
          Please review the attached registration certificate PDF. If all details are correct, click 'Approve' below to finalize the registration and automatically dispatch the success email to the owner.
        </p>
        
        <div style="margin-bottom:40px">
          <a href="${urlApprove}" style="background:#ff6b47;color:#000;padding:14px 28px;text-decoration:none;display:inline-block;font-weight:bold;letter-spacing:1px;text-transform:uppercase;font-size:12px;margin-right:12px">
            Approve Kiosk
          </a>
          <a href="${urlReject}" style="background:transparent;border:1px solid rgba(255,255,255,0.2);color:#a3a3a3;padding:13px 24px;text-decoration:none;display:inline-block;font-weight:bold;letter-spacing:1px;text-transform:uppercase;font-size:12px">
            Reject
          </a>
        </div>
        
        <p style="color:#4a4a4a;font-size:11px;font-family:monospace">
          INNVERA Automated Registration System
        </p>
      </div>`,
      ``,
      `--${boundary}`,
      `Content-Type: application/pdf`,
      `Content-Transfer-Encoding: base64`,
      `Content-Disposition: attachment; filename="innvera-kiosk-${kioskId}.pdf"`,
      ``,
      pdfBuffer.toString("base64"),
      ``,
      `--${boundary}--`
    ].join("\r\n")

    const params = {
      RawMessage: { Data: Buffer.from(rawEmail) },
      Destinations: ["msrihari2224@gmail.com"],
      Source: process.env.SES_FROM_EMAIL || "innvera.co@gmail.com"
    }

    await ses.sendRawEmail(params).promise()
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

exports.sendSettlementApprovalMail = async (kioskData, settlement) => {
  const urlApprove = `${process.env.BASE_URL}/api/kiosk/${kioskData.kioskId}/settlement/${settlement._id}/approve`;

  const params = {
    Source: process.env.SES_FROM_EMAIL || "innvera.co@gmail.com",
    Destination: { ToAddresses: ["msrihari2224@gmail.com"] },
    Message: {
      Subject: { Data: `[Settlement Request] INNVERA Kiosk — ${kioskData.username}` },
      Body: {
        Html: {
          Data: `
            <div style="background:#0a0a0a;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,sans-serif;padding:40px;max-width:600px;border:1px solid #333">
              <h1 style="color:#ff6b47;font-size:24px;letter-spacing:-1px;margin:0 0 8px;font-weight:900;text-transform:uppercase">INNVERA</h1>
              <p style="color:#a3a3a3;font-size:10px;font-family:monospace;letter-spacing:2px;text-transform:uppercase;margin:0 0 32px;display:inline-block;border-bottom:1px solid #333;padding-bottom:4px">
                Settlement Review
              </p>
              <h2 style="font-size:20px;font-weight:900;margin:0 0 20px;text-transform:uppercase;letter-spacing:-0.5px">
                Review: ₹${settlement.amount} for ${kioskData.username}
              </h2>
              
              <div style="background:#111;border:1px solid #222;padding:16px;margin-bottom:24px">
                <p style="margin:0 0 8px;font-size:14px"><span style="color:#666;text-transform:uppercase;font-size:10px;letter-spacing:1px;margin-right:12px">Amount</span> ₹${settlement.amount}</p>
                <p style="margin:0 0 8px;font-size:14px"><span style="color:#666;text-transform:uppercase;font-size:10px;letter-spacing:1px;margin-right:12px">Tx_ID</span> ${settlement.transactionId}</p>
                <p style="margin:0 0 8px;font-size:14px"><span style="color:#666;text-transform:uppercase;font-size:10px;letter-spacing:1px;margin-right:12px">Period</span> ${new Date(settlement.fromDate).toLocaleDateString()} to ${new Date(settlement.toDate).toLocaleDateString()}</p>
              </div>

              <div style="margin-bottom:40px">
                <a href="${urlApprove}" style="background:#22c55e;color:#000;padding:14px 28px;text-decoration:none;display:inline-block;font-weight:bold;letter-spacing:1px;text-transform:uppercase;font-size:12px;margin-right:12px">
                  Approve and Notify Owner
                </a>
              </div>
            </div>
          `
        }
      }
    }
  };

  try {
    await ses.sendEmail(params).promise();
    console.log(`Settlement approval email sent for ${kioskData.username}`);
  } catch (error) {
    console.error("Settlement approval email error:", error.message);
  }
}

exports.sendSettlementInvoiceMail = async (kioskData, settlement) => {
  const params = {
    Source: process.env.SES_FROM_EMAIL || "innvera.co@gmail.com",
    Destination: { ToAddresses: [kioskData.ownerEmail] },
    Message: {
      Subject: { Data: `[INNVERA] Settlement Approved — ${kioskData.kioskId}` },
      Body: {
        Html: {
          Data: `
            <div style="background:#000;color:#fff;font-family:sans-serif;padding:40px;max-width:600px">
              <h1 style="color:#ff6b47;font-size:28px;letter-spacing:-1px;margin:0 0 8px">INNVERA</h1>
              <p style="color:#a3a3a3;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:0 0 32px">Settlement Approved</p>
              <h2 style="font-size:20px;margin:0 0 16px">Hello, ${kioskData.ownerName || kioskData.username}!</h2>
              <p>Your settlement for <strong style="color:#ff6b47">₹${settlement.amount}</strong> has been processed and approved.</p>
              
              <div style="background:#111;border:1px solid #222;padding:16px;margin-top:24px;margin-bottom:24px">
                <p style="margin:0 0 8px"><strong style="color:#a3a3a3">Transaction ID:</strong> ${settlement.transactionId}</p>
                <p style="margin:0"><strong style="color:#a3a3a3">Period:</strong> ${new Date(settlement.fromDate).toLocaleDateString()} to ${new Date(settlement.toDate).toLocaleDateString()}</p>
              </div>

              <p style="color:#a3a3a3">You can view your full settlement invoice by logging into your Kiosk Owner Dashboard.</p>
              <br/>
              <p style="color:#4a4a4a;font-size:12px">INNVERA · innvera.co · support@innvera.co</p>
            </div>
          `
        }
      }
    }
  };

  try {
    await ses.sendEmail(params).promise();
    console.log(`Settlement invoice email sent to ${kioskData.ownerEmail}`);
  } catch (error) {
    console.error("Settlement invoice email error:", error.message);
  }
}