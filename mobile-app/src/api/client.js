import axios from 'axios';

const baseURL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.169:8000';

export const api = axios.create({
  baseURL,
  timeout: 30000,
});
