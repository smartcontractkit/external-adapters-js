import { Requester, Validator, Logger } from '@chainlink/ea-bootstrap'
import {
  Config,
  ExecuteWithConfig,
  ExecuteFactory,
  MakeWSHandler,
  AdapterRequest,
} from '@chainlink/types'
import { makeConfig } from './config'


export const execute: ExecuteWithConfig<Config> = async (_, __) => {
  throw Error("The NCFX adapter does not support making HTTP requests.  Please wait a few seconds while the adapter sets up the WebSockets connection.")
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request) => execute(request, config || makeConfig())
}

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
}

export const makeWSHandler = (config?: Config): MakeWSHandler => {
  const getPair = (input: AdapterRequest) => {
    const validator = new Validator(input, customParams, {}, false)
    if (validator.error) return
    const base = validator.validated.data.base.toUpperCase()
    const quote = validator.validated.data.quote.toUpperCase()
    return `${base}/${quote}`
  }
  const getSubscription = (request: 'subscribe' | 'unsubscribe', pair?: string) => {
    if (!pair) return
    return { request, ccy: pair }
  }
  return () => {
    const defaultConfig = config || makeConfig()
    return {
      connection: {
        url: `${defaultConfig.api.baseWebsocketURL}/cryptodata`,
      },
      subscribe: (input) => getSubscription('subscribe', getPair(input)),
      unsubscribe: (input) => getSubscription('unsubscribe', getPair(input)),
      subsFromMessage: (message, subscriptionMsg) => {
        if(Array.isArray(message) && message.length > 0) {
          const pairMessage = message.find(({ currencyPair }) => currencyPair === subscriptionMsg.ccy)
          if (!pairMessage) Logger.warn(`${subscriptionMsg.ccy} not found in message`)
          return getSubscription('subscribe', `${pairMessage.currencyPair}`)
        }
        return getSubscription('subscribe', `${message}`)
      },
      isError: (message: any) => Number(message.TYPE) > 400 && Number(message.TYPE) < 900,
      filter: () => {
        return true
      },
      toResponse: (message: any, input: AdapterRequest) => {
        if (Array.isArray(message) && message.length > 0) {
          const pair = getPair(input)
          const pairMessage = message.find(({ currencyPair }) => currencyPair === pair)
          if (!pairMessage) Logger.warn(`${pair} not found in message`)
          const result = Requester.validateResultNumber(pairMessage, ['mid'])
          return Requester.success('1', { data: { result } })
        }
        Logger.warn(`${message} is in an unexpected format.  Returning null for now.`)
        return Requester.success('1', { data: { result: null } })
      },
      onConnect: () => ({
        request: 'login',
        username: defaultConfig.api.auth.username,
        password: defaultConfig.api.auth.password,
      }),
    }
  }
}
