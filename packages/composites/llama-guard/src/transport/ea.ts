import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import {
  AdapterError,
  AdapterInputError,
} from '@chainlink/external-adapter-framework/validation/error'

export const getRawNav = async (ea: string, eaInput: string, requester: Requester) => {
  const requestConfig = {
    baseURL: getEAUrl(ea),
    method: 'POST',
    data: {
      data: JSON.parse(eaInput),
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
  const normalizedEA = ea.replace('-', '_').toUpperCase()
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

const parse = (response: any): number => {
  if (typeof response === 'number') {
    return response
  }

  if (typeof response === 'string') {
    const num = Number(response)
    if (!isNaN(num)) {
      return num
    }
  }

  throw new AdapterError({
    statusCode: 500,
    message: `EA response is not a number: ${response}`,
  })
}
