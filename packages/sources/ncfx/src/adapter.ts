import { Requester, Validator } from '@chainlink/ea-bootstrap'
import {
  Config,
  ExecuteWithConfig,
  ExecuteFactory,
  MakeWSHandler,
  AdapterRequest,
} from '@chainlink/types'
import { makeConfig } from './config'

const inputParams = {
  endpoint: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error

  Requester.logConfig(config)

  const jobRunID = validator.validated.id

  return Requester.success(jobRunID, {})
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
    const base = validator.validated.data.quote.toUpperCase()
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
      subsFromMessage: (message) => {
        console.log(message)
        return getSubscription('subscribe', `${message?.FROMSYMBOL}/${message?.TOSYMBOL}`)
      },
      isError: (message: any) => Number(message.TYPE) > 400 && Number(message.TYPE) < 900,
      filter: () => {
        return true
      },
      toResponse: (message: any) => {
        console.log(message)
        const result = Requester.validateResultNumber(message, ['PRICE'])
        return Requester.success('1', { data: { result } })
      },
      onConnect: () => ({
        request: 'login',
        username: defaultConfig.api.auth.username,
        password: defaultConfig.api.auth.password,
      }),
    }
  }
}
