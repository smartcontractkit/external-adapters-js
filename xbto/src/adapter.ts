import { Execute } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/external-adapter'
import { util } from '@chainlink/ea-bootstrap'

const customParams = {}

export const execute: Execute = async (input) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const url = 'https://fpiw7f0axc.execute-api.us-east-1.amazonaws.com/api'

  const auth = {
    password: util.getRandomRequiredEnv('API_KEY'),
  }

  const config = {
    url,
    auth,
  }

  const response = await Requester.request(config)
  response.data.result = Requester.validateResultNumber(response.data, ['index'])
  return Requester.success(jobRunID, response)
}
