const express = require("express");
const cors = require("cors");
require("dotenv").config();

const containerRoutes = require("./routes/containers");
const volumeRoutes = require("./routes/volumes");
const networkRoutes = require("./routes/networks");
const imageRoutes = require("./routes/images");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" }));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/containers", containerRoutes);
app.use("/api/volumes", volumeRoutes);
app.use("/api/networks", networkRoutes);
app.use("/api/images", imageRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Docker Manager API running on http://localhost:${PORT}`);
});
