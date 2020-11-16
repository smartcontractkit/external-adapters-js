import { Execute } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/external-adapter'

const customParams = {}

export const execute: Execute = async (input) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const url = 'https://stasis.net/transparency/eurs-statement'

  const config = {
    url,
  }

  const response = await Requester.request(config)
  response.data.result = Requester.validateResultNumber(response.data, ['amount'])
  return Requester.success(jobRunID, response)
}
