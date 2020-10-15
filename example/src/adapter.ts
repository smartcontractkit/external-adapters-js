import { Execute } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/external-adapter'

const customError = (data: any) => data.Response === 'Error'

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
  endpoint: false,
}

export const execute: Execute = async (input) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || 'price'
  const url = `http://localhost:18081/${endpoint}`
  const base = validator.validated.data.base.toUpperCase()
  const quote = validator.validated.data.quote.toUpperCase()

  const params = {
    base,
    quote,
  }

  const config = {
    url,
    params,
  }

  const response = await Requester.request(config, customError)
  response.data.result = Requester.validateResultNumber(response.data, ['price'])
  return Requester.success(jobRunID, response)
}
