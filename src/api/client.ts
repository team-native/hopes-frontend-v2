import axios from 'axios'
import { clearToken, getToken } from '../utils/token'

const client = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
})

client.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  config.headers['X-Hopes-Client'] = 'WEB'
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      getToken() &&
      !error.config?.url?.endsWith('/api/login')
    ) {
      clearToken()
    }
    return Promise.reject(error)
  },
)

export default client
