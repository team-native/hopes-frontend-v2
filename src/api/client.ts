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
    // 로그인 · 회원탈퇴는 401이 "비밀번호 틀림"일 수 있어서 각 API 함수가 직접 처리해요
    const url = axios.isAxiosError(error) ? (error.config?.url ?? '') : ''
    const handlesOwn401 = url.endsWith('/api/login') || url.endsWith('/api/account')
    if (axios.isAxiosError(error) && error.response?.status === 401 && getToken() && !handlesOwn401) {
      clearToken()
    }
    return Promise.reject(error)
  },
)

export default client
