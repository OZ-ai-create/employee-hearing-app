import axios from 'axios';

const api = axios.create({
  baseURL: 'https://employee-hearing-app.onrender.com/api',
});

export default api;