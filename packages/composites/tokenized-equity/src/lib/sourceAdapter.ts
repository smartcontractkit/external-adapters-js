import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'

type Response = {
  data: {
    multiplier: number | string
    activationDateTime: string
    newMultiplier: number | string
  }
  statusCode: number
}

export const getMultiplier = async (
  adapter: string,
  url: string,
  params: string,
  requester: Requester,
) => {
  const requestConfig = {
    baseURL: url,
    method: 'POST',
    data: {
      data: JSON.parse(params),
    },
  }

  try {
    const response = await requester.request<Response>(JSON.stringify(requestConfig), requestConfig)

    const data = response?.response?.data
    if (!data || !data.data) {
      throw new AdapterError({
        statusCode: 500,
        message: `EA ${adapter} request failed: ${JSON.stringify(response?.response?.data)} ${
          response?.response?.status
        } ${response?.response?.statusText}`,
      })
    }
    return data.data
  } catch (e) {
    if (e instanceof AdapterError) {
      e.message = `${e.message} ${JSON.stringify(e?.errorResponse) || e.name}`
    }
    throw e
  }
}
