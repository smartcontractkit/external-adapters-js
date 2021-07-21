import { Builder, Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, ExecuteFactory, MakeWSHandler } from '@chainlink/types'
import { makeConfig } from './config'
import * as endpoints from './endpoint'

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  return Builder.buildSelector(request, config, endpoints)
}
export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request) => execute(request, config || makeConfig())
}

export interface WebsocketResponseSchema {
  time: string
  asset: string
  ReferenceRateUSD?: string
  ReferenceRateEUR?: string
  cm_sequence_id: string
}

export const makeWSHandler = (config?: Config): MakeWSHandler => {
  return () => {
    let asset = ''
    let metrics = ''

    const defaultConfig = config || makeConfig()
    return {
      connection: {
        url: defaultConfig.api.baseWsURL,
      },
      subscribe: () => `${asset}${metrics}`,
      unsubscribe: () => '',
      subsFromMessage: (message) => `${message.asset}${metrics}`,
      isError: () => false,
      filter: () => true,
      toResponse: (message: WebsocketResponseSchema) => {
        const result = Requester.validateResultNumber(message, [metrics])
        return Requester.success('1', { data: { result } })
      },
      programmaticConnectionInfo: (input) => {
        const validator = new Validator(input, endpoints.price.inputParameters, {}, false)
        if (validator.error) return
        asset = validator.validated.data.base.toLowerCase()
        const quote = validator.validated.data.quote
        metrics = `ReferenceRate${quote.toUpperCase()}`
        const url = `${defaultConfig.api.baseWsURL}/timeseries-stream/asset-metrics?assets=${asset}&metrics=${metrics}&frequency=1s&api_key=${defaultConfig.apiKey}`

        return {
          key: `${asset}${metrics}`,
          url,
        }
      }
    }
  }
}
