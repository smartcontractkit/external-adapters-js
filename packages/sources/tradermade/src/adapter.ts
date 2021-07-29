import { ExecuteWithConfig, Config, ExecuteFactory, AdapterRequest, AxiosResponse, MakeWSHandler } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { makeConfig, NAME, DEFAULT_WS_API_ENDPOINT } from './config'
import * as endpoints from './endpoint'


const customParams = {
  base: ['base', 'from', 'symbol', 'market'],
  to: false,
}

const handleBatchedRequest = (
  jobRunID: string,
  request: AdapterRequest,
  response: AxiosResponse<any>,
  resultPath: string,
) => {
  const payload: [AdapterRequest, number][] = []
  for (const pair of response.data.quotes) {
    const symbol = pair.base_currency
    const to = pair.quote_currency
    payload.push([
      {
        ...request,
        data: { ...request.data, from: symbol.toUpperCase(), to: to.toUpperCase() },
      },
      Requester.validateResultNumber(pair, [resultPath]),
    ])

  }
  return Requester.success(jobRunID, Requester.withResult(response, undefined, payload), true, ['from', 'to'])
}


export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  Requester.logConfig(config)

  const jobRunID = validator.validated.id
  const symbol = validator.overrideSymbol(NAME)
  const to = (validator.validated.data.to || '')
  const pairArray = []
  console.log(to)
  for (const fromCurrency of formatArray(symbol)) {
    for (const toCurrency of formatArray(to)) {
      pairArray.push(`${fromCurrency.toUpperCase() + toCurrency.toUpperCase()}`)
    }
  }
  const currency = pairArray.toString()
  const params = {
    ...config.api.params,
    currency,
  }

  const options = { ...config.api, params }

  const response = await Requester.request(options)
  if (Array.isArray(symbol) || Array.isArray(to)) return handleBatchedRequest(jobRunID, request, response, 'mid')

  response.data.result = Requester.validateResultNumber(response.data, ['quotes', 0, 'mid'])
  return Requester.success(jobRunID, response, config.api.verbose, [{name: 'from',},{name: 'to',},])
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}

export const makeWSHandler = (config?: Config): MakeWSHandler | undefined => {
  const getSubscription = (pair?: string) => {
    const defaultConfig = config || makeConfig()
    if (!pair) return
    const sub = {
      userKey: defaultConfig.wsApiKey,
      symbol: pair,
    }
    return sub
  }
  const getPair = (input: AdapterRequest) => {
    const validator = new Validator(input, endpoints.forex.customParams, {}, false)
    if (validator.error) return
    const base = validator.validated.data.base.toUpperCase()
    const quote = validator.validated.data.quote.toUpperCase()
    return `${base}${quote}`
  }
  return () => {
    const defaultConfig = config || makeConfig()
    return {
      connection: {
        url: defaultConfig.api.baseWsURL || DEFAULT_WS_API_ENDPOINT,
      },
      shouldNotServeInputUsingWS: (input: AdapterRequest) =>
        endpoints.forex.supportedEndpoints.indexOf(input.data.endpoint) === -1,
      subscribe: (input: AdapterRequest) => getSubscription(getPair(input)),
      unsubscribe: () => null, // Tradermade does not support unsubscribing.
      subsFromMessage: (message) => {
        if (!message.symbol) return undefined
        return getSubscription(message.symbol)
      },
      isError: () => false, // No error
      filter: (message: any) => !!message.mid,
      toResponse: (message: any) => {
        const result = Requester.validateResultNumber(message, ['mid'])
        return Requester.success('1', { data: { result } })
      },
    }
  }
}
// format input as an array regardless of if it is a string or an array already
function formatArray(input: string | string[]) {
  let result = []
  if(typeof(input)==='string')
      result.push(input)
  else
      result = input
  return result
}
