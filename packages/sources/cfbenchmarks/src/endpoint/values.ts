import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['values']

export const inputParameters: InputParameters = {
  index: true,
}

interface PayloadValue {
  value: string
  time: number
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const id = validator.validated.data.index
  const url = `/v1/values`

  const params = {
    id,
  }

  const reqConfig = { ...config.api, params, url }

  const response = await Requester.request(reqConfig)

  const values = (response.data.payload as PayloadValue[]).sort((a, b) => {
    if (a.time < b.time) return 1
    if (a.time > b.time) return -1
    return 0
  })
  response.data.result = Requester.validateResultNumber(values, [0, 'value'])

  return Requester.success(jobRunID, response, config.verbose)
}
