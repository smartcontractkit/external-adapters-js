import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { AdapterRequest, AdapterResponse, MakeWSHandler } from '@chainlink/types'
import { Config, DEFAULT_WS_API_ENDPOINT, makeConfig, NAME } from './config'

export const customParams = {
  base: ['base', 'from', 'asset'],
}

export const execute = async (input: AdapterRequest, config: Config) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const symbol = (validator.overrideSymbol(NAME) as string).toUpperCase()

  // Fall back to getting the data from HTTP endpoint
  const url = `/symbol/${symbol}`

  const params = {
    c: `${config.client.key}:${config.client.secret}`,
  }

  const request = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request(request)
  if (!response.data || response.data.length < 1) {
    throw new Error('no result for query')
  }
  // Replace array by the first object in array
  // to avoid unexpected behavior when returning arrays.
  response.data = response.data[0]

  response.data.result = Requester.validateResultNumber(response.data, ['Last'])
  return Requester.success(jobRunID, response)
}

export const makeExecute = (config?: Config) => {
  return async (request: AdapterRequest) => execute(request, config || makeConfig())
}

export const makeWSHandler = (config?: Config): MakeWSHandler => {
  // http://api.tradingeconomics.com/documentation/Streaming
  // https://github.com/boxhock/tradingeconomics-nodejs-stream/blob/master/src/index.ts
  const withApiKey = (url: string, key: string, secret: string) => `${url}?client=${key}:${secret}`
  const getSubscription = (to: string) => ({ topic: 'subscribe', to })

  return () => {
    const defaultConfig = config || makeConfig()

    return {
      connection: {
        url: withApiKey(
          defaultConfig.api.baseWsURL || DEFAULT_WS_API_ENDPOINT,
          defaultConfig.client.key || '',
          defaultConfig.client.secret || '',
        ),
      },
      subscribe: (input) => {
        const validator = new Validator(input, customParams, {}, false)
        if (validator.error) {
          return
        }
        const base = (validator.overrideSymbol(NAME) as string).toUpperCase()
        return getSubscription(base)
      },
      unsubscribe: () => undefined,
      subsFromMessage: (message) => getSubscription(message?.s),
      isError: (message: any) => Number(message.TYPE) > 400 && Number(message.TYPE) < 900,
      filter: (message) => {
        return message.topic && message.topic !== 'keepalive'
      },
      toResponse: (wsResponse: any): AdapterResponse =>
        Requester.success(undefined, { data: { result: wsResponse?.price } }),
    }
  }
}
