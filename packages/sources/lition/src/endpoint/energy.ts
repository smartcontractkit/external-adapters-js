import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['energy']

export const inputParameters: InputParameters = {
  source: true,
  date: false,
  hour: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const source = validator.validated.data.source
  const currentTime = new Date()
  const date = validator.validated.data.date || `${currentTime.toISOString().slice(0, 10)}` // YYYY-MM-DD
  const hour = validator.validated.data.hour || currentTime.getUTCHours()

  const url = `energy/source/${source}/date/${date}/hour/${hour}/`

  const options = {
    ...config.api,
    url,
  }

  const response = await Requester.request(options)
  response.data.result = Requester.validateResultNumber(response.data, ['price'])
  return Requester.success(jobRunID, response, config.verbose)
}
