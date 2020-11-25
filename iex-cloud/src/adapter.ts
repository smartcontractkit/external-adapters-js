import { Execute } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/external-adapter'

const customParams = {
  symbol: ['base', 'from', 'symbol'],
}

export const execute: Execute = async (input) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const symbol = validator.validated.data.symbol.toLowerCase()
  const url = `https://cloud.iexapis.com/stable/stock/${symbol}/quote/latestPrice`
  const token = process.env.API_KEY

  const params = { token }
  const config = {
    url,
    params,
  }

  const response = await Requester.request(config)
  response.data.result = Requester.validateResultNumber(response.data)
  return Requester.success(jobRunID, response)
}
