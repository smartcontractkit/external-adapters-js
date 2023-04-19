import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/ea-bootstrap'

export const supportedEndpoints = [
  'realized-vol',
  'realised-vol',
  'realizedVol',
  'realisedVol',
  'rv',
]

const TIINGO_REALIZED_VOL_PREFIX = 'real_vol_'
const TIINGO_REALIZED_VOL_URL = `tiingo/crypto/prices`
const TIINGO_REALIZED_VOL_DEFAULT_QUOTE = 'USD'

export type TInputParameters = { base: string; quote: string }

export const inputParameters: InputParameters<TInputParameters> = {
  base: {
    aliases: ['from', 'coin'],
    required: true,
    type: 'string',
    description: 'The base currency to query the realized volatility for',
  },
  quote: {
    aliases: ['to', 'convert'],
    required: false,
    default: TIINGO_REALIZED_VOL_DEFAULT_QUOTE,
    type: 'string',
    description: 'The quote currency to convert the realized volatility to',
  },
}

interface CryptoYieldResponse {
  baseCurrency: string
  quoteCurrency: string
  realVolData: {
    date: string
    realVol1Day: number
    realVol7Day: number
    realVol30Day: number
  }[]
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters, {})

  const jobRunID = validator.validated.id
  const { base, quote } = validator.validated.data
  const resultPath = (validator.validated.data.resultPath || 'realVol30Day').toString()

  const reqConfig = {
    ...config.api,
    params: {
      token: config.apiKey,
      // prepend real_vol to baseCurrency
      baseCurrency: `${TIINGO_REALIZED_VOL_PREFIX}${base}`,
      convertCurrency: quote,
      consolidateBaseCurrency: true,
    },
    url: TIINGO_REALIZED_VOL_URL,
  }

  const response = await Requester.request<CryptoYieldResponse[]>(reqConfig)
  const result = Requester.validateResultNumber(response.data, [0, 'realVolData', 0, resultPath])
  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
