const express = require("express");
const router = express.Router();
const docker = require("../docker");

// List all images
router.get("/", async (req, res, next) => {
  try {
    const images = await docker.listImages({ all: false });
    res.json(images);
  } catch (err) {
    next(err);
  }
});

// Inspect an image
router.get("/:id", async (req, res, next) => {
  try {
    const image = docker.getImage(req.params.id);
    const data = await image.inspect();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Pull an image
router.post("/pull", async (req, res, next) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: "image name required" });

    await new Promise((resolve, reject) => {
      docker.pull(image, (err, stream) => {
        if (err) return reject(err);
        docker.modem.followProgress(stream, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    });

    res.json({ message: `Image ${image} pulled successfully` });
  } catch (err) {
    next(err);
  }
});

// Remove an image
router.delete("/:id", async (req, res, next) => {
  try {
    const image = docker.getImage(req.params.id);
    await image.remove({ force: true });
    res.json({ message: "Image removed" });
  } catch (err) {
    next(err);
  }
});

// Prune dangling images
router.post("/prune", async (req, res, next) => {
  try {
    const result = await docker.pruneImages();
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
