const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api')
  .replace(/\/+$/, '')

export const endpoints = {
  LOGIN_API: BASE_URL + "/auth/login",
  USER_API: BASE_URL + "/auth/user",
  LOGOUT_API: BASE_URL + "/auth/logout",
  GET_OFFERS_TRAFFIC_API: BASE_URL + "/offers/traffic",
  GET_OFFERS_TRAFFIC_OFFER_API: BASE_URL + "/offers/traffic/offer"
}
