import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'
import { NAME as AdapterName } from '../../config'
import overrides from '../../config/symbols.json'

export const supportedEndpoints = ['prices', 'crypto', 'volume', 'crypto-synth']

export const endpointResultPaths = {
  prices: 'fxClose',
  crypto: 'fxClose',
  volume: 'volumeNotional',
}

export interface ResponseSchema {
  ticker: string
  baseCurrency: string
  quoteCurrency: string
  priceData: {
    date: string
    open: number
    high: number
    low: number
    close: number
    volume: number
    volumeNotional: number
    fxOpen: number
    fxHigh: number
    fxLow: number
    fxClose: number
    fxVolumeNotional: number
    fxRate: number
    tradesDone: number
  }[]
}

export const description = `The \`crypto\`, \`volume\`, and \`prices\` endpoints come from https://api.tiingo.com/documentation/crypto.

\`crypto\` and \`prices\` endpoints return a VWAP of all the exchanges on the current day and across base tokens.

\`volume\` returns the 24h volume for a pair.`

export const inputParameters: InputParameters = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
  resultPath: false,
}

// When an invalid symbol is given the response body is empty
const customError = (data: ResponseSchema[]) => !data.length

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters, {}, { overrides })

  const jobRunID = validator.validated.id
  const base = validator.overrideSymbol(AdapterName)
  const quote = validator.validated.data.quote.toLowerCase()
  const resultPath = validator.validated.data.resultPath
  const url = '/tiingo/crypto/prices'

  const options = {
    ...config.api,
    params: {
      token: config.apiKey,
      baseCurrency: base,
      convertCurrency: quote,
      consolidateBaseCurrency: true,
      resampleFreq: '24hour',
    },
    url,
  }

  const response = await Requester.request<ResponseSchema[]>(options, customError)
  const result = Requester.validateResultNumber(response.data, [0, 'priceData', 0, resultPath])

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
