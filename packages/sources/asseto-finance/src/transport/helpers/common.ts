import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'

export interface AssetoApiResponseBaseSchema {
  code: number
  message: string
}

export function validateApiResponse(status: number, data: AssetoApiResponseBaseSchema) {
  if (status === 401) {
    throw new AdapterError({
      statusCode: 502,
      message: 'Auth invalid, will retry next background execute',
      providerStatusCode: status,
    })
  } else if (status !== 200) {
    throw new AdapterError({
      statusCode: 502,
      message: data.message,
      providerStatusCode: status,
    })
  } else if (data.code !== 0) {
    throw new AdapterError({
      statusCode: 502,
      message: data.message,
    })
  }
}
