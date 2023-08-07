import {
  AdapterInputError,
  AdapterResponseInvalidError,
  ExecuteWithConfig,
  InputParameters,
  Logger,
  Requester,
  Validator,
  util,
} from '@chainlink/ea-bootstrap'
import { getRpcLatestAnswer } from '@chainlink/ea-reference-data-reader'
import { Config, DEFAULT_NETWORK } from '../config'

export const supportedEndpoints = ['transform']

export type TInputParameters = {
  source: string
  contract: string
  multiply: number
  operator: string
  dividend: string
  network: string
}
const inputParameters: InputParameters<TInputParameters> = {
  source: true,
  contract: ['referenceContract'],
  multiply: false,
  operator: ['operator'],
  dividend: false,
  network: false,
}

const transform = (offchain: number, onchain: number, operator: string, dividendConfig: string) => {
  if (operator === 'multiply') {
    return offchain * onchain
  } else if (operator === 'divide') {
    let dividend = offchain
    let divisor = onchain
    if (dividendConfig === 'on-chain') {
      dividend = onchain
      divisor = offchain
    }
    return dividend / divisor
  }
  throw new AdapterInputError({ message: 'Invalid operator' })
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const source = validator.validated.data.source
  const contract = validator.validated.data.contract
  const multiply = validator.validated.data.multiply || 100000000
  const operator = validator.validated.data.operator
  const dividend = validator.validated.data.dividend || 'off-chain'
  const network = validator.validated.data.network || DEFAULT_NETWORK

  if (operator !== 'multiply' && operator !== 'divide')
    throw new AdapterInputError({
      jobRunID,
      message: `Invalid operator parameter supplied.`,
      statusCode: 400,
    })

  if (dividend !== 'on-chain' && dividend !== 'off-chain')
    throw new AdapterInputError({
      jobRunID,
      message: `Invalid divident parameter supplied.`,
      statusCode: 400,
    })

  Logger.debug('Getting value from contract: ' + contract)

  let price = await getRpcLatestAnswer(network, contract, 1)
  price = price / multiply
  Logger.debug('Value: ' + price)

  if (price <= 0)
    throw new AdapterResponseInvalidError({
      jobRunID,
      message: `On-chain value equal or less than 0.`,
      statusCode: 500,
    })

  const options = {
    ...Requester.getDefaultConfig(config.prefix),
    baseURL: util.getURL(source.toUpperCase()),
    method: 'post',
  } as const

  const response = (await Requester.request({ ...options, data: request })).data as any
  response.data.result = transform(response.result, price, operator, dividend)

  Logger.debug('New result: ' + response.data.result)

  return Requester.success(jobRunID, response)
}
