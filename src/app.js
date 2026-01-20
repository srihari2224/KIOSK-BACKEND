const express = require("express")
const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use("/api/kiosk", require("./routes/kiosk.routes"))
app.use("/api/auth", require("./routes/auth.routes"))

module.exports = app
