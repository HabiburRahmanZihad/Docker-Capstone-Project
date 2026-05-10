const express = require("express");
const router = express.Router();
const docker = require("../docker");

// List all volumes
router.get("/", async (req, res, next) => {
  try {
    const data = await docker.listVolumes();
    res.json(data.Volumes || []);
  } catch (err) {
    next(err);
  }
});

// Inspect a volume
router.get("/:name", async (req, res, next) => {
  try {
    const volume = docker.getVolume(req.params.name);
    const data = await volume.inspect();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Create a volume
router.post("/", async (req, res, next) => {
  try {
    const { name, driver, labels } = req.body;
    const volume = await docker.createVolume({
      Name: name,
      Driver: driver || "local",
      Labels: labels || {},
    });
    res.status(201).json(volume);
  } catch (err) {
    next(err);
  }
});

// Remove a volume
router.delete("/:name", async (req, res, next) => {
  try {
    const volume = docker.getVolume(req.params.name);
    await volume.remove();
    res.json({ message: "Volume removed" });
  } catch (err) {
    next(err);
  }
});

// Prune unused volumes
router.post("/prune", async (req, res, next) => {
  try {
    const result = await docker.pruneVolumes();
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
