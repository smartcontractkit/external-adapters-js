import { Requester, Validator, AdapterError, Logger } from '@chainlink/ea-bootstrap'
import { AdapterResponse, Execute, AdapterRequest } from '@chainlink/types'
import { makeConfig, Config } from './config'
import { getRpcLatestAnswer } from '@chainlink/ea-reference-data-reader'

const customParams = {
  source: true,
  contract: ['referenceContract'],
  multiply: false,
  operator: ['operator'],
  dividend: false,
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
  throw new Error('Invalid operator')
}

export const execute = async (input: AdapterRequest, config: Config): Promise<AdapterResponse> => {
  const validator = new Validator(input, customParams, { source: Object.keys(config.sources) })
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const source = validator.validated.data.source
  const contract = validator.validated.data.contract
  const multiply = validator.validated.data.multiply || 100000000
  const operator = validator.validated.data.operator
  const dividend = validator.validated.data.dividend || 'off-chain'

  if (operator !== 'multiply' && operator !== 'divide')
    throw new AdapterError({
      jobRunID,
      message: `Invalid operator parameter supplied.`,
      statusCode: 400,
    })

  if (dividend !== 'on-chain' && dividend !== 'off-chain')
    throw new AdapterError({
      jobRunID,
      message: `Invalid divident parameter supplied.`,
      statusCode: 400,
    })

  Logger.debug('Getting value from contract: ' + contract)

  let price = await getRpcLatestAnswer(contract, 1)
  price = price / multiply
  Logger.debug('Value: ' + price)

  if (price <= 0)
    throw new AdapterError({
      jobRunID,
      message: `On-chain value equal or less than 0.`,
      statusCode: 500,
    })

  const options = config.sources[source]
  const response = (await Requester.request({ ...options, data: input })).data
  response.data.result = transform(response.result, price, operator, dividend)

  Logger.debug('New result: ' + response.data.result)

  return Requester.success(jobRunID, response)
}

export const makeExecute = (config?: Config): Execute => {
  return async (request: AdapterRequest) => execute(request, config || makeConfig())
}
