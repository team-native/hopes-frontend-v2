const TOKEN_KEY = 'hopes:access-token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string, keepLogin: boolean) {
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
  ;(keepLogin ? localStorage : sessionStorage).setItem(TOKEN_KEY, token)
  window.dispatchEvent(new Event('hopes:authenticated'))
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
  window.dispatchEvent(new Event('hopes:logged-out'))
}
