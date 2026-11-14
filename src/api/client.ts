import axios from 'axios'

// 모든 API 요청은 이 인스턴스를 사용하세요.
const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export default client
