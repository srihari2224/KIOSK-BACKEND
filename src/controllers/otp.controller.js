const OTP = require("../models/OTP")
const Upload = require("../models/Upload")
const AWS = require("aws-sdk")

exports.verifyOtp = async (req, res) => {
  const { otp, kioskId } = req.body

  const record = await OTP.findOne({
    otp,
    kioskId,
    used: false,
    expiresAt: { $gt: new Date() }
  })

  if (!record) {
    return res.status(400).json({ success: false, error: "Invalid OTP" })
  }

  record.used = true
  await record.save()

  const upload = await Upload.findOne({ uploadId: record.uploadId })

  res.json({
    success: true,
    uploadId: upload.uploadId,
    file: upload.files[0],
    printOptions: upload.printOptions
  })
}

exports.downloadFile = async (req, res) => {
  const { uploadId } = req.params

  const upload = await Upload.findOne({ uploadId })
  if (!upload) return res.status(404).send("Not found")

  const s3 = new AWS.S3()
  const stream = s3.getObject({
    Bucket: process.env.AWS_BUCKET,
    Key: upload.files[0]
  }).createReadStream()

  res.setHeader("Content-Type", "application/pdf")
  stream.pipe(res)
}
