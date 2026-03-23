import api from "../lib/apiClient";

export const getFlights = () => api.get("/global-ops/flights");
export const getNews = () => api.get("/global-ops/news");
export const getWebcams = () => api.get("/global-ops/webcams");
export const getSummary = () => api.get("/global-ops/summary");
export const getEntities = () => api.get("/global-ops/entities");
export const getPolymarket = () => api.get("/global-ops/polymarket");
export const getShips = () => api.get("/global-ops/ships");
export const getHeat = () => api.get("/global-ops/heat");