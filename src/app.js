const express = require("express")
const cors = require("cors")

const app = express()

// Allow all origins (or specify your Vercel URL later)
app.use(cors())

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check route for monitor
app.get("/", (req, res) => {
  res.send("Kiosk Backend Running")
})

app.use("/api/kiosk", require("./routes/kiosk.routes"))
app.use("/api/auth", require("./routes/auth.routes"))

module.exports = app
