import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  timeout: 30000,
});

export const containers = {
  list: () => api.get("/containers"),
  inspect: (id) => api.get(`/containers/${id}`),
  logs: (id) => api.get(`/containers/${id}/logs`),
  stats: (id) => api.get(`/containers/${id}/stats`),
  start: (id) => api.post(`/containers/${id}/start`),
  stop: (id) => api.post(`/containers/${id}/stop`),
  restart: (id) => api.post(`/containers/${id}/restart`),
  remove: (id) => api.delete(`/containers/${id}`),
  create: (data) => api.post("/containers", data),
};

export const volumes = {
  list: () => api.get("/volumes"),
  inspect: (name) => api.get(`/volumes/${name}`),
  create: (data) => api.post("/volumes", data),
  remove: (name) => api.delete(`/volumes/${name}`),
  prune: () => api.post("/volumes/prune"),
};

export const networks = {
  list: () => api.get("/networks"),
  inspect: (id) => api.get(`/networks/${id}`),
  create: (data) => api.post("/networks", data),
  remove: (id) => api.delete(`/networks/${id}`),
  connect: (id, containerId) => api.post(`/networks/${id}/connect`, { containerId }),
  disconnect: (id, containerId) => api.post(`/networks/${id}/disconnect`, { containerId }),
  prune: () => api.post("/networks/prune"),
};

export const images = {
  list: () => api.get("/images"),
  inspect: (id) => api.get(`/images/${id}`),
  pull: (image) => api.post("/images/pull", { image }),
  remove: (id) => api.delete(`/images/${id}`),
  prune: () => api.post("/images/prune"),
};

export default api;
