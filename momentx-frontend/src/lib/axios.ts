import axios from "axios";

// Ensure this matches your Backend Port
const BASE_URL = "http://localhost:3000/api/v1/users";

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // IMPORTANT: Allows cookies (tokens) to be sent/received
  headers: {
    "Content-Type": "application/json",
  },
});
