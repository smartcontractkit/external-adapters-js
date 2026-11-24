import { Requester } from '@chainlink/external-adapter-framework/util/requester'

let token: string
let tokenExpiry: number

type Response = {
  token_type: string
  expires_in: number // in seconds
  access_token: string
  scope: string
}

const ONE_MINUTE = 60 * 1000

export const getToken = async (url: string, key: string, requester: Requester) => {
  if (token && Date.now() < tokenExpiry) {
    return token
  }

  const response = await requester.request<Response>(url, {
    method: 'POST',
    baseURL: url,
    url: 'gettoken/token',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${key}`,
    },
    data: new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'rtg_ssa',
    }).toString(),
  })

  token = response?.response?.data?.access_token
  tokenExpiry = Date.now() + response?.response?.data?.expires_in * 1000
  tokenExpiry -= ONE_MINUTE // Refresh slightly before it expires (usually in 30 mins)

  if (!token) {
    throw new Error(`Failed to obtain access token: ${JSON.stringify(response?.response?.data)}`)
  }

  return token
}
