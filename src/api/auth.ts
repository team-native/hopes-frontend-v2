// import client from './client'

export interface LoginRequest {
  email: string
  password: string
  keepLogin: boolean
}

/**
 * 로그인 요청
 * TODO: 백엔드 API가 나오면 아래 가짜 코드를 지우고 실제 요청으로 바꾸세요.
 *   const { data } = await client.post('/auth/login', request)
 *   return data
 */
export async function login(request: LoginRequest): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // 가짜 응답: 지금은 항상 실패 처리해서 에러 화면을 확인할 수 있게 해 둠
  void request
  throw new Error('INVALID_CREDENTIALS')
}
