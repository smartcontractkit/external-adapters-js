import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import {
  AdapterError,
  AdapterInputError,
} from '@chainlink/external-adapter-framework/validation/error'
import { trimDecimals } from './nav'

export const getRawNav = async (source: string, sourceInput: string, requester: Requester) => {
  const requestConfig = {
    baseURL: getEAUrl(source),
    method: 'POST',
    data: {
      data: JSON.parse(sourceInput),
    },
  }

  try {
    const response = await requester.request(JSON.stringify(requestConfig), requestConfig)

    const data = response?.response?.data
    if (!data || !(data as any).result) {
      throw new AdapterError({
        statusCode: (data as any)?.statusCode || 500,
        message: `EA request failed: ${JSON.stringify(response?.response)}`,
      })
    }

    return parse((data as any).result)
  } catch (e) {
    if (e instanceof AdapterError) {
      e.message = `${e.message} ${JSON.stringify(e?.errorResponse) || e.name}`
    }
    throw e
  }
}

export const getEAUrl = (ea: string) => {
  const normalizedEA = ea.replace(/-/g, '_').toUpperCase()
  const keyName = `${normalizedEA}_EA_URL`
  const url = process.env[keyName]

  if (!url) {
    throw new AdapterInputError({
      statusCode: 400,
      message: `Missing '${normalizedEA}' environment variable.`,
    })
  }

  return url
}

const WEI = 18
const parse = (response: any): string => {
  if (typeof response === 'number') {
    return response.toString()
  }

  if (typeof response === 'string') {
    if (!isNaN(Number(response))) {
      if (response.indexOf('.') === -1) {
        // Response may already be scaled, use BigInt to avoid overflow
        return BigInt(response).toString()
      } else {
        // Avoid having too many decimals here
        return trimDecimals(response.trim(), WEI)
      }
    }
  }

  throw new AdapterError({
    statusCode: 500,
    message: `EA response is not a number: ${response}`,
  })
}
