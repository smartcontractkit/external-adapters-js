import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config } from '@chainlink/types'

export const supportedEndpoints = ['events']

const customParams = {
  sportId: true,
  date: true,
  status: false
}

export interface ResponseSchema {
  events: {
    score: {
      event_status: string
    }
  }[]
}

const formatDate = (date: Date): string => {
  const pad = (n: number) => n<10 ? '0'+n : n
  return date.getUTCFullYear()+'-'
    + pad(date.getUTCMonth()+1)+'-'
    + pad(date.getUTCDate())
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
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
    response.data.events = (response.data as ResponseSchema).events.filter(({ score: { event_status }}) => event_status === status)
  }
  response.data.result = response.data.events

  return Requester.success(jobRunID, response, config.verbose)
}
