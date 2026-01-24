const AWS = require("aws-sdk")

const ses = new AWS.SES({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_SES_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SES_SECRET_KEY
})

exports.sendApprovalMail = async ({ ownerEmail, kioskId, token }) => {
  const url = `${process.env.BASE_URL}/api/kiosk/approve?kioskId=${kioskId}&token=${token}`

  const params = {
    Source: process.env.SES_FROM_EMAIL,
    Destination: {
      ToAddresses: [ownerEmail]
    },
    Message: {
      Subject: { Data: "Approve kiosk" },
      Body: {
        Html: {
          username,
          Data: `<h3>Approve kiosk</h3><a href="${url}">APPROVE</a>`
        }
      }
    }
  }

  await ses.sendEmail(params).promise()
}
