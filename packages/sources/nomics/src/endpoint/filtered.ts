import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'
import { NAME as AdapterName } from '../config'
import overrides from '../config/symbols.json'

export const supportedEndpoints = ['filtered']

export const endpointResultPaths = {
  filtered: 'price',
}

const customError = (data: Record<string, unknown>) => {
  return Object.keys(data).length === 0
}

export const description = 'Fetches the price of an asset using specified exchanges.'

export const inputParameters: InputParameters = {
  base: {
    aliases: ['from', 'coin', 'id'],
    required: true,
    description: 'The symbol of the currency to query',
  },
  exchanges: {
    required: true,
    description: 'Comma delimited list of exchange names',
  },
}

export interface ResponseSchema {
  currency: string
  price: number
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters, {}, { overrides })

  const symbolToIdOverride = validator.symbolToIdOverride?.[AdapterName.toLowerCase()]

  if (symbolToIdOverride) {
    if (Array.isArray(validator.validated.data.base)) {
      for (let i = 0; i < validator.validated.data.base.length; i++) {
        if (symbolToIdOverride[validator.validated.data.base[i]]) {
          validator.validated.data.base[i] = symbolToIdOverride[validator.validated.data.base[i]]
        }
      }
    } else if (symbolToIdOverride[validator.validated.data.base]) {
      validator.validated.data.base = symbolToIdOverride[validator.validated.data.base]
    }
  }

  // Will there every be 'duplicate overrides' where a specified id from symbolToIdOverride
  // is then overridden in overrideSymbol? Currently, this code assumes there are not.

  const symbol = validator.overrideSymbol(AdapterName)
  const jobRunID = validator.validated.id
  const exchanges = validator.validated.data.exchanges
  const resultPath = validator.validated.data.resultPath

  const url = `/prices/restricted`

  const params = {
    currency: symbol,
    key: config.apiKey,
    exchanges: exchanges,
  }
  const reqConfig = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request<ResponseSchema>(reqConfig, customError)

  const result = Requester.validateResultNumber(response.data, resultPath)
  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
