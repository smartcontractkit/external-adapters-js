import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'

interface GeneralResponse<T> {
  data: T[]
  page: {
    next: string
  }
}

export const request = async <T>(
  requester: Requester,
  endpoint: string,
  path: string,
  apiKey: string,
  apiLimit: number,
) => {
  const results: T[] = []

  const requestConfig = {
    baseURL: endpoint,
    url: path + `?limit=${apiLimit}`,
    headers: {
      'Api-Access-Key': apiKey,
    },
  }

  let hasNext = true
  while (hasNext) {
    const response = await requester.request<GeneralResponse<T>>(
      JSON.stringify(requestConfig),
      requestConfig,
    )

    if (!response || !response.response || !response.response.data) {
      throw new AdapterError({
        statusCode: 500,
        message: `API ${requestConfig.baseURL + requestConfig.url} does not return data`,
      })
    }

    results.push(...response.response.data.data)

    requestConfig.url = response.response.data.page.next
    hasNext = response.response.data.page.next !== null
  }

  return results
}
