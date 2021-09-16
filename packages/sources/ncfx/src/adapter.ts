import { Requester, Validator, Logger, Builder } from '@chainlink/ea-bootstrap'
import {
  Config,
  ExecuteWithConfig,
  ExecuteFactory,
  MakeWSHandler,
  AdapterRequest,
  APIEndpoint,
} from '@chainlink/types'
import { makeConfig } from './config'
import * as endpoints from './endpoint'

export const execute: ExecuteWithConfig<Config> = async (request, context, config) => {
  return Builder.buildSelector(request, context, config, endpoints)
}

export const endpointSelector = (request: AdapterRequest): APIEndpoint =>
  Builder.selectEndpoint(request, makeConfig(), endpoints)

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}

export const makeWSHandler = (config?: Config): MakeWSHandler => {
  const getPair = (input: AdapterRequest) => {
    const validator = new Validator(input, endpoints.crypto.inputParameters, {}, false)
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
        getUrl: async (input: AdapterRequest) => {
          const endpoint = input.data.endpoint
          if (endpoints.forex.supportedEndpoints.indexOf(endpoint) !== -1) {
            return `${defaultConfig.adapterSpecificParams?.forexDefaultBaseWSUrl}/spotdata`
          }
          return `${defaultConfig.api.baseWebsocketURL}/cryptodata`
        },
      },
      noHttp: true,
      subscribe: (input) => getSubscription('subscribe', getPair(input)),
      unsubscribe: (input) => getSubscription('unsubscribe', getPair(input)),
      subsFromMessage: (message, subscriptionMsg) => {
        if (Array.isArray(message) && message.length > 0) {
          const pairMessage = message.find(
            ({ currencyPair }) => currencyPair === subscriptionMsg.ccy,
          )
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
          const endpoint = input.data.endpoint
          const resultField =
            endpoints.forex.supportedEndpoints.indexOf(endpoint) !== -1 ? 'rate' : 'mid'
          const result = Requester.validateResultNumber(pairMessage, [resultField])
          return Requester.success('1', { data: { ...pairMessage, result } }, defaultConfig.verbose)
        }
        Logger.warn(`${message} is in an unexpected format.  Returning null for now.`)
        return Requester.success('1', { data: { result: null } })
      },
      onConnect: (input: AdapterRequest) => {
        const endpoint = input.data.endpoint
        const username =
          endpoints.forex.supportedEndpoints.indexOf(endpoint) !== -1
            ? defaultConfig.adapterSpecificParams?.forexWSUsername
            : defaultConfig.api.auth.username
        const password =
          endpoints.forex.supportedEndpoints.indexOf(endpoint) !== -1
            ? defaultConfig.adapterSpecificParams?.forexWSPassword
            : defaultConfig.api.auth.password
        return {
          request: 'login',
          username,
          password,
        }
      },
    }
  }
}
