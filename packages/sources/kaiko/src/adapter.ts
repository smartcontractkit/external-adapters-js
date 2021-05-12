import { Requester, Validator } from '@chainlink/ea-bootstrap'
import {
  Config,
  ExecuteWithConfig,
  ExecuteFactory,
  Includes,
  IncludePair,
  MakeWSHandler,
  AdapterRequest,
} from '@chainlink/types'
import {
  DEFAULT_INTERVAL,
  DEFAULT_SORT,
  DEFAULT_MILLISECONDS,
  makeConfig,
  NAME as AdapterName,
  DEFAULT_WS_API_ENDPOINT,
} from './config'

const customError = (data: any) => data.result === 'error'

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
  includes: false,
  interval: false,
  sort: false,
  millisecondsAgo: false,
}

const symbolUrl = (from: string, to: string) =>
  to.toLowerCase() === 'eth'
    ? directUrl(from, to)
    : `/spot_exchange_rate/${from.toLowerCase()}/${to.toLowerCase()}`

const directUrl = (from: string, to: string) =>
  `/spot_direct_exchange_rate/${from.toLowerCase()}/${to.toLowerCase()}`

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error
  Requester.logConfig(config)

  const jobRunID = validator.validated.id

  // provide a reasonable interval to fetch only recent results
  function calculateStartTime(millisecondsAgo: number) {
    const date = new Date()
    date.setTime(date.getTime() - millisecondsAgo)
    return date
  }

  const { url, inverse } = getOptions(validator)

  const interval = validator.validated.data.interval || DEFAULT_INTERVAL
  const start_time = calculateStartTime(
    validator.validated.data.millisecondsAgo || DEFAULT_MILLISECONDS,
  )
  const sort = validator.validated.data.sort || DEFAULT_SORT

  const params = { interval, sort, start_time }

  const requestConfig = {
    ...config.api,
    url,
    params,
    timeout: 10000,
  }
  const response = await Requester.request(requestConfig, customError)

  response.data.result = Requester.validateResultNumber(
    // sometimes, the most recent(fraction of a second) data contain null price
    response.data.data.filter((x: any) => x.price !== null),
    [0, 'price'],
    { inverse },
  )

  return Requester.success(jobRunID, response, config.verbose)
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}

const getOptions = (
  validator: Validator,
): {
  url: string
  inverse?: boolean
} => {
  const base = validator.overrideSymbol(AdapterName) as string
  const quote = validator.validated.data.quote
  const includes = validator.validated.includes || []

  const includeOptions = getIncludesOptions(validator, base, quote, includes)
  return (
    includeOptions ?? {
      url: symbolUrl(base, quote),
    }
  )
}

const getIncludesOptions = (
  validator: Validator,
  from: string,
  to: string,
  includes: string[] | Includes[],
) => {
  const include = getIncludes(validator, from, to, includes)
  if (!include) return undefined
  return {
    url: directUrl(include.from, include.to),
    inverse: include.inverse,
  }
}

const getIncludes = (
  validator: Validator,
  from: string,
  to: string,
  includes: string[] | Includes[],
): IncludePair | undefined => {
  if (includes.length === 0) return undefined

  const presetIncludes = validator.overrideIncludes(AdapterName, from, to)
  if (presetIncludes && typeof includes[0] === 'string') return presetIncludes
  else if (typeof includes[0] === 'string') {
    return {
      from,
      to: includes[0],
      inverse: false,
    }
  }
  return presetIncludes
}

type MessageType = 'info' | 'error' | 'update'

interface Message {
  event: MessageType
  payload: Record<string, any>
}

interface UpdateMessage extends Message {
  event: 'info'
  payload: {
    subscription: {
      topic: string
      data_version: string
      exchange: string
      instrument_class: string
      instrument: string
    }
    data: {
      timestamp: number
      trade_id: string
      price: string
      amount: string
      taker_side_sell: boolean
    }[]
  }
}

export const makeWSHandler = (config?: Config): MakeWSHandler => {
  const getSubscription = (instrumentCode?: string, subscribe = true) => {
    if (!instrumentCode) return
    return {
      command: subscribe ? 'subscribe' : 'unsubscribe',
      args: {
        subscriptions: {
          topic: 'trades_ws',
          pattern: `*:spot:${instrumentCode}`,
          // "data_version": <data_version> // Defaults to latest version
        },
      },
    }
  }
  const getInstrument = (input: AdapterRequest) => {
    const validator = new Validator(input, customParams)
    if (validator.error) return
    const base = validator.validated.data.base.toUpperCase()
    const quote = validator.validated.data.quote.toUpperCase()
    return `${base}-${quote}`
  }
  return () => {
    const defaultConfig = config || makeConfig()
    return {
      connection: {
        url: defaultConfig.api.baseWsURL || DEFAULT_WS_API_ENDPOINT,
      },
      subscribe: (input) => getSubscription(getInstrument(input)),
      unsubscribe: (input) => getSubscription(getInstrument(input), false),
      isError: (message: Message) => message.event === 'error',
      filter: (message: Message) => message.event === 'update',
      subsFromMessage: (message: UpdateMessage) =>
        getSubscription(message?.payload?.subscription?.instrument),
      toResponse: (message: UpdateMessage) => {
        const result = Requester.validateResultNumber(message.payload, ['data', 0, 'price'])
        return Requester.success('1', { data: { result } })
      },
    }
  }
}
