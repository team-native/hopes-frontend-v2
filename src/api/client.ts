import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://service.gsmsv.site:22116'

// 모든 API 요청은 이 인스턴스를 사용하세요.
const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('hopes:access-token') ?? sessionStorage.getItem('hopes:access-token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  config.headers['X-Hopes-Client'] = 'WEB'
  return config
})

export default client
