import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true, // Always send cookies
});

// Note: Authorization header is now added by AuthContext interceptor
// This keeps token management centralized and secure

export default api;
