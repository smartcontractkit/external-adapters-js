import { Execute } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { util } from '@chainlink/ea-bootstrap'

const customError = (data: any) => data.Response === 'Error'

const customParams = {
  market: ['market', 'from', 'future'],
}

const commonKeys: Record<string, string> = {
  brent: 'BRN',
}

export const execute: Execute = async (input) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  let market = validator.validated.data.market.toLowerCase()
  if (market in commonKeys) market = commonKeys[market]

  const url = `https://api.ice.linkpool.io/v1/futures/${market.toUpperCase()}/sip62`

  const headers = {
    'x-api-key': util.getRandomRequiredEnv('API_KEY'),
  }

  const config = {
    url,
    headers,
  }

  const response = await Requester.request(config, customError)
  response.data.result = Requester.validateResultNumber(response.data, ['result'])
  return Requester.success(jobRunID, response)
}
