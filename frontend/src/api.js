import axios from 'axios'
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const api = axios.create({
  baseURL: API_URL // if backend has prefix (e.g. /api) add here
})

// attach token header automatically
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('campusride_token')
  if(token) cfg.headers.Authorization = 'Bearer ' + token
  return cfg
})

export default api
