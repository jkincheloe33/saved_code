import Axios from 'axios'
import { destroyCookie } from 'nookies'

const errorPaths = [500]
const api = Axios.create({
  baseURL: '/api/site',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

api.interceptors.response.use(
  res => res,
  err => {
    const { status } = err.response
    const prevUrl = window.location.href.split('/').reverse()[0]

    if (status === 401) {
      // Exclude subdomain from host. Ex: Get 'wambidev.com' only
      const hostParts = window.location.host.split('.').reverse()
      const domain = `${hostParts[1]}.${hostParts[0]}`

      destroyCookie(null, 'tkn', { domain, path: '/' })
      window.location.href = `/auth/complete?prevUrl=${prevUrl}`
    } else if (errorPaths.some(error => error === status)) {
      if (window.location.href.includes('localhost:30')) {
        // We are local deving.. leave the path alone...EK
      } else {
        window.location.href = '/error'
      }
    }
  }
)

export default api
