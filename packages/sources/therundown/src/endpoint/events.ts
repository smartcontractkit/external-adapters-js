import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'
import { DateTime } from 'luxon'

export const supportedEndpoints = ['events']

export const inputParameters: InputParameters = {
  sportId: true,
  date: true,
  status: false,
}

export interface ResponseSchema {
  events: {
    score: {
      event_status: string
    }
  }[]
}

const formatDate = (date: Date): string => {
  const pad = (n: number) => (n < 10 ? '0' + n : n)
  const { year, month, day } = DateTime.fromJSDate(date).setZone('America/New_York')
  return `${year}-${pad(month)}-${pad(day)}`
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const sportId = validator.validated.data.sportId
  const date = validator.validated.data.date
  const status = validator.validated.data.status
  const url = `/sports/${sportId}/events/${formatDate(date)}`

  const reqConfig = {
    ...config.api,
    headers: {
      ...config.api.headers,
      'x-rapidapi-key': config.apiKey,
    },
    params: {
      include: 'scores',
    },
    url,
  }

  const response = await Requester.request(reqConfig)
  if (status !== undefined) {
    response.data.events = (response.data as ResponseSchema).events.filter(
      ({ score: { event_status } }) => event_status === status,
    )
  }
  response.data.result = response.data.events

  return Requester.success(jobRunID, response, config.verbose)
}
