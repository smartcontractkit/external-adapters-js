import { Builder, Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteFactory, ExecuteWithConfig, MakeWSHandler } from '@chainlink/types'
import { DEFAULT_WS_API_ENDPOINT, makeConfig, NAME } from './config'
import { assets, price } from './endpoint'

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const chainlinkEndpoints = [assets, price]
  return Builder.buildSelector(request, config, chainlinkEndpoints)
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request) => execute(request, config || makeConfig())
}

export const makeWSHandler = (config?: Config): MakeWSHandler => () => {
  const defaultConfig = config || makeConfig()
  const getSubscription = (products: string[]) => ({
    type: 'hello',
    apikey: defaultConfig.apiKey,
    heartbeat: false,
    subscribe_data_type: ['exrate'],
    subscribe_filter_asset_id: products,
  })
  return {
    connection: {
      url: defaultConfig.api.baseWsURL || DEFAULT_WS_API_ENDPOINT,
    },
    subscribe: (input) => {
      const validator = new Validator(input, price.customParams, {}, false)
      if (validator.error) return
      const base = (validator.overrideSymbol(NAME) as string).toLowerCase()
      const quote = validator.validated.data.quote.toLowerCase()
      return getSubscription([base, quote])
    },
    unsubscribe: () => undefined,
    subsFromMessage: (message) => getSubscription([message.asset_id_base, message.asset_id_quote]),
    isError: () => false,
    filter: (message) => message?.type === 'exrate',
    toResponse: (message) => {
      const result = Requester.validateResultNumber(message, ['rate'])
      return Requester.success('1', { data: { result } })
    },
  }
}
