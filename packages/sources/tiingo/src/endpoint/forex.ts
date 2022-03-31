import { Requester, util, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/ea-bootstrap'
import { NAME } from '../config'
import overrides from '../config/symbols.json'

export const supportedEndpoints = ['forex', 'fx', 'commodities']

export const endpointResultPaths = {
  fx: 'midPrice',
  forex: 'midPrice',
  commodities: 'midPrice',
}

export const description = 'https://api.tiingo.com/documentation/forex'

export type TInputParameters = { base: string; quote: string }
export const inputParameters: InputParameters<TInputParameters> = {
  base: {
    aliases: ['asset', 'from', 'market'],
    required: true,
    description: 'The asset to query',
  },
  quote: {
    aliases: ['to'],
    required: true,
    description: 'The quote to convert to',
  },
}

interface ResponseSchema {
  ticker: string
  quoteTimestamp: string
  bidPrice: number
  bidSize: number
  askPrice: number
  askSize: number
  midPrice: number
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator<TInputParameters>(request, inputParameters, {}, { overrides })

  const jobRunID = validator.validated.id
  const base = validator.overrideSymbol(NAME, validator.validated.data.base)
  const quote = validator.validated.data.quote
  const ticker = `${base}${quote}`.toLowerCase()
  const resultPath = (validator.validated.data.resultPath || '').toString()
  const url = util.buildUrlPath('/tiingo/fx/:ticker/top', { ticker })

  const reqConfig = {
    ...config.api,
    params: {
      token: config.apiKey,
    },
    url,
  }

  const response = await Requester.request<ResponseSchema[]>(reqConfig)
  const result = Requester.validateResultNumber(response.data[0], resultPath)

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
