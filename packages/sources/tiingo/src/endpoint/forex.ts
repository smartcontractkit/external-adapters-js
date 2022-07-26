import { IncludePair, Requester, util, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/ea-bootstrap'
import { NAME as AdapterName } from '../config'
import includes from '../config/includes.json'
import overrides from '../config/symbols.json'

export const supportedEndpoints = ['forex', 'fx', 'commodities']

export const endpointResultPaths = {
  fx: 'midPrice',
  forex: 'midPrice',
  commodities: 'midPrice',
}

export const description =
  'https://api.tiingo.com/documentation/forex This endpoint has the ability to leverage inverses in the scenario a specific pair exists but not its inverse on the Tiingo forex API.'

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

export type TOptions = {
  url: string
  inverse?: boolean
}

const getUrl = (from: string, to: string) => ({
  url: util.buildUrlPath('/tiingo/fx/:ticker/top', { ticker: `${from}${to}`.toLowerCase() }),
})

const getIncludesOptions = (_: Validator<TInputParameters>, include: IncludePair) => {
  return {
    ...getUrl(include.from, include.to),
    inverse: include.inverse,
  }
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters, {}, { includes, overrides })

  const jobRunID = validator.validated.id
  const resultPath = (validator.validated.data.resultPath || '').toString()

  const { url, inverse } = util.getPairOptions<TOptions, TInputParameters>(
    AdapterName,
    validator,
    getIncludesOptions,
    getUrl,
  ) as TOptions // If base and quote cannot be batched, getPairOptions will return TOptions

  const reqConfig = {
    ...config.api,
    params: {
      token: config.apiKey,
    },
    url,
  }

  const response = await Requester.request<ResponseSchema[]>(reqConfig)
  const result = Requester.validateResultNumber(response.data, [0, resultPath], { inverse })

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
