import { Requester } from '@chainlink/external-adapter-framework/util/requester'

type Response = {
  last_modified_date_time: string // 2025-12-19T00:00:00Z
  security_id: string
  security_name: string
  ssa: string
  ssa_desc: string
}[]

export const getSecurities = async (
  url: string,
  token: string,
  key: string,
  requester: Requester,
) => {
  const response = await requester.request<Response>(url, {
    method: 'GET',
    baseURL: url,
    url: 'ssa-defiscoreapi/extoauthv2/api/v1/ssa/getAllScores',
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: key,
    },
  })

  if (!Array.isArray(response?.response?.data) || response?.response?.data?.length === 0) {
    throw new Error('No SSA data found')
  }
  return response.response.data.map((item) => ({
    security_id: item.security_id,
    ssa: Number(item.ssa),
    time: new Date(item.last_modified_date_time).getTime(),
  }))
}
