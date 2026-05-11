const Docker = require("dockerode");

// Windows named pipes require backslash UNC format (\\.\\pipe\\...)
// Linux/macOS use the unix socket
const isWindows = process.platform === "win32";

const docker = new Docker(
  isWindows
    ? { socketPath: "\\\\.\\pipe\\docker_engine" }
    : { socketPath: "/var/run/docker.sock" }
);

module.exports = docker;
