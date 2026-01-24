const AWS = require("aws-sdk")

const ses = new AWS.SES({
  region: process.env.AWS_REGION || "us-east-1",
  accessKeyId: process.env.AWS_SES_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SES_SECRET_KEY
})

exports.sendApprovalMail = async ({ ownerEmail, kioskId, username }) => {
  const url = `${process.env.BASE_URL}/api/kiosk/approve?kioskId=${kioskId}`

  const params = {
    Source: process.env.SES_FROM_EMAIL || "noreply@yourdomain.com",
    Destination: {
      ToAddresses: [ownerEmail]
    },
    Message: {
      Subject: { Data: "Approve Your Print Kiosk" },
      Body: {
        Html: {
          Data: `
            <h2>Print Kiosk Registration</h2>
            <p>A new kiosk has been registered with username: <strong>${username}</strong></p>
            <p>Click the link below to approve:</p>
            <a href="${url}" style="background: #1abc9c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              APPROVE KIOSK
            </a>
            <br/><br/>
            <p>Or copy this link: ${url}</p>
          `
        }
      }
    }
  }

  try {
    await ses.sendEmail(params).promise()
    console.log(`✅ Approval email sent to ${ownerEmail}`)
  } catch (error) {
    console.error("❌ Email sending failed:", error.message)
    // Don't throw error - allow registration to proceed even if email fails
  }
}