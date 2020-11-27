import { Execute } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/external-adapter'

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
}

export const execute: Execute = async (input) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const base = validator.validated.data.base.toLowerCase()
  const quote = validator.validated.data.quote.toLowerCase()
  const url = `https://ar.coinmonitor.info/api/v3/${base}_${quote}/`

  const config = {
    url,
  }

  const response = await Requester.request(config)
  response.data.result = Requester.validateResultNumber(response.data, ['mediana_prom'])
  return Requester.success(jobRunID, response)
}
