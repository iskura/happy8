const AUTH_KEY = 'happy8-authed'
const PASSWORD = '200731'

export function isAuthenticated() {
  try {
    return localStorage.getItem(AUTH_KEY) === '1'
  } catch {
    return false
  }
}

export function login(password) {
  if (password !== PASSWORD) return false
  try {
    localStorage.setItem(AUTH_KEY, '1')
    return true
  } catch {
    return false
  }
}
