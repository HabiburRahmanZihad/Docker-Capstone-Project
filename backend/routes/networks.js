const express = require("express");
const router = express.Router();
const docker = require("../docker");

// List all networks
router.get("/", async (req, res, next) => {
  try {
    const networks = await docker.listNetworks();
    res.json(networks);
  } catch (err) {
    next(err);
  }
});

// Inspect a network
router.get("/:id", async (req, res, next) => {
  try {
    const network = docker.getNetwork(req.params.id);
    const data = await network.inspect();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Create a network
router.post("/", async (req, res, next) => {
  try {
    const { name, driver, internal, labels } = req.body;
    const network = await docker.createNetwork({
      Name: name,
      Driver: driver || "bridge",
      Internal: internal || false,
      Labels: labels || {},
    });
    res.status(201).json({ message: "Network created", id: network.id });
  } catch (err) {
    next(err);
  }
});

// Remove a network
router.delete("/:id", async (req, res, next) => {
  try {
    const network = docker.getNetwork(req.params.id);
    await network.remove();
    res.json({ message: "Network removed" });
  } catch (err) {
    next(err);
  }
});

// Connect a container to a network
router.post("/:id/connect", async (req, res, next) => {
  try {
    const { containerId } = req.body;
    const network = docker.getNetwork(req.params.id);
    await network.connect({ Container: containerId });
    res.json({ message: "Container connected to network" });
  } catch (err) {
    next(err);
  }
});

// Disconnect a container from a network
router.post("/:id/disconnect", async (req, res, next) => {
  try {
    const { containerId } = req.body;
    const network = docker.getNetwork(req.params.id);
    await network.disconnect({ Container: containerId, Force: true });
    res.json({ message: "Container disconnected from network" });
  } catch (err) {
    next(err);
  }
});

// Prune unused networks
router.post("/prune", async (req, res, next) => {
  try {
    const result = await docker.pruneNetworks();
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
