const Docker = require("dockerode");

// Windows: named pipe; Linux/macOS: unix socket
const isWindows = process.platform === "win32";

const docker = new Docker(
  isWindows
    ? { socketPath: "//./pipe/docker_engine" }
    : { socketPath: "/var/run/docker.sock" }
);

module.exports = docker;
