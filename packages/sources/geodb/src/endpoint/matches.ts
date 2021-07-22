import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['matches']

export const inputParameters: InputParameters = {
  lat: true,
  lng: true,
  radius: true,
  start: true,
  end: true,
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const lat = validator.validated.data.lat
  const lng = validator.validated.data.lng
  const radius = validator.validated.data.radius
  const start = validator.validated.data.start
  const end = validator.validated.data.end
  const url = encodeURI(`/matches?start=${start}&end=${end}&lat=${lat}&lng=${lng}&radius=${radius}`)

  const reqConfig = {
    ...config.api,
    url,
  }

  const response = await Requester.request(reqConfig)
  response.data.result = parseInt(response.data.matches)

  return Requester.success(jobRunID, response, config.verbose)
}
