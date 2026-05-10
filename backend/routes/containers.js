const express = require("express");
const router = express.Router();
const docker = require("../docker");

// List all containers (including stopped)
router.get("/", async (req, res, next) => {
  try {
    const containers = await docker.listContainers({ all: true });
    res.json(containers);
  } catch (err) {
    next(err);
  }
});

// Inspect a single container
router.get("/:id", async (req, res, next) => {
  try {
    const container = docker.getContainer(req.params.id);
    const data = await container.inspect();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Get container logs
router.get("/:id/logs", async (req, res, next) => {
  try {
    const container = docker.getContainer(req.params.id);
    const logs = await container.logs({
      stdout: true,
      stderr: true,
      tail: 100,
      timestamps: true,
    });
    // logs is a Buffer; strip docker multiplexing headers
    const text = logs
      .toString("utf8")
      .split("\n")
      .map((line) => (line.length > 8 ? line.slice(8) : line))
      .join("\n");
    res.json({ logs: text });
  } catch (err) {
    next(err);
  }
});

// Get container stats (one-shot)
router.get("/:id/stats", async (req, res, next) => {
  try {
    const container = docker.getContainer(req.params.id);
    const stats = await container.stats({ stream: false });
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

// Start a container
router.post("/:id/start", async (req, res, next) => {
  try {
    const container = docker.getContainer(req.params.id);
    await container.start();
    res.json({ message: "Container started" });
  } catch (err) {
    next(err);
  }
});

// Stop a container
router.post("/:id/stop", async (req, res, next) => {
  try {
    const container = docker.getContainer(req.params.id);
    await container.stop();
    res.json({ message: "Container stopped" });
  } catch (err) {
    next(err);
  }
});

// Restart a container
router.post("/:id/restart", async (req, res, next) => {
  try {
    const container = docker.getContainer(req.params.id);
    await container.restart();
    res.json({ message: "Container restarted" });
  } catch (err) {
    next(err);
  }
});

// Remove a container
router.delete("/:id", async (req, res, next) => {
  try {
    const container = docker.getContainer(req.params.id);
    await container.remove({ force: true });
    res.json({ message: "Container removed" });
  } catch (err) {
    next(err);
  }
});

// Create and run a new container
router.post("/", async (req, res, next) => {
  try {
    const { image, name, ports, env, cmd } = req.body;

    const portBindings = {};
    const exposedPorts = {};
    if (ports) {
      Object.entries(ports).forEach(([host, container]) => {
        exposedPorts[`${container}/tcp`] = {};
        portBindings[`${container}/tcp`] = [{ HostPort: String(host) }];
      });
    }

    const container = await docker.createContainer({
      Image: image,
      name,
      Cmd: cmd || undefined,
      Env: env || [],
      ExposedPorts: exposedPorts,
      HostConfig: { PortBindings: portBindings },
    });

    await container.start();
    res.status(201).json({ message: "Container created and started", id: container.id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
