import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'
import { NAME as AdapterName } from '../../config'
import { ResponseSchema } from './prices'

export const supportedEndpoints = ['vwap', 'crypto-vwap']

export const endpointResultPaths = {
  vwap: 'fxClose',
  'crypto-vwap': 'fxClose',
}

export const inputParameters: InputParameters = {
  base: {
    aliases: ['from', 'coin'],
    type: 'string',
    required: true,
  },
  quote: {
    aliases: ['to', 'market'],
    type: 'string',
    required: true,
  },
  hours: {
    description: 'Number of hours to get VWAP for',
    type: 'number',
    default: 24,
  },
  resultPath: false,
}

// When an invalid symbol is given the response body is empty
const customError = (data: ResponseSchema[]) => !data.length || !data[0].priceData.length

const formatUtcDate = (date: Date) => date.toISOString().split('T')[0]

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  let base = validator.overrideSymbol(AdapterName)
  if (Array.isArray(base)) base = base[0]

  const quote = validator.validated.data.quote.toLowerCase()
  const resultPath = validator.validated.data.resultPath
  const url = '/tiingo/crypto/prices'

  const endDate = new Date()
  const subMs = validator.validated.data.hours * 60 * 60 * 1000
  const startDate = new Date(endDate.getTime() - subMs)

  const options = {
    ...config.api,
    params: {
      token: config.apiKey,
      baseCurrency: `${base.toLowerCase()}cvwap`,
      convertCurrency: quote.toLowerCase(),
      consolidateBaseCurrency: true,
      resampleFreq: '24hour',
      startDate: formatUtcDate(startDate),
      endDate: formatUtcDate(endDate),
    },
    url,
  }

  const response = await Requester.request<ResponseSchema[]>(options, customError)
  const result = Requester.validateResultNumber(response.data, [0, 'priceData', 0, resultPath])

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
