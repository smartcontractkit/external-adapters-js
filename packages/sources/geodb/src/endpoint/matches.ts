import { Requester, util, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['matches']

export const description =
  'Counts the number of matches within the circle specified by a radius and coordinates during the selected time period.'

export const inputParameters: InputParameters = {
  lat: {
    required: true,
    description: 'latitude coordinate',
    type: 'string',
  },
  lng: {
    required: true,
    description: 'longitude coordinate',
    type: 'string',
  },
  radius: {
    required: true,
    description: 'radius around coordinates (in m)',
    type: 'string',
  },
  start: {
    required: true,
    description: 'start time (yyyy-mm-dd hh:mm:ss)',
    type: 'string',
  },
  end: {
    required: true,
    description: 'end time (yyyy-mm-dd hh:mm:ss)',
    type: 'string',
  },
}

export interface ResponseSchema {
  matches: string
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const lat = validator.validated.data.lat
  const lng = validator.validated.data.lng
  const radius = validator.validated.data.radius
  const start = validator.validated.data.start
  const end = validator.validated.data.end
  const url = util.buildUrlPath('/matches')

  const reqConfig = {
    ...config.api,
    url,
    params: { start, end, lat, lng, radius },
  }

  const response = await Requester.request<ResponseSchema>(reqConfig)
  const result = Requester.validateResultNumber(response.data, ['matches'])

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
