import { AdapterInputError, Requester, util, Validator } from '@chainlink/ea-bootstrap'
import {
  AxiosRequestConfig,
  ExecuteWithConfig,
  Config,
  InputParameters,
} from '@chainlink/ea-bootstrap'

export const supportedEndpoints = ['events']

export const description = 'Returns all events within the specified params'

export type TInputParameters = { sportId: string | number; date: string; status: string }
export const inputParameters: InputParameters<TInputParameters> = {
  sportId: {
    required: true,
    description: 'The ID of the sport to get events from',
  },
  date: {
    required: true,
    description: 'The date to get events from',
    type: 'string',
  },
  status: {
    required: false,
    description: 'Optional status param to filter events on',
    type: 'string',
  },
}

export interface ResponseSchema {
  events: {
    score: {
      event_status: string
    }
  }[]
  result: {
    score: {
      event_status: string
    }
  }[]
}

const formatDate = (date: Date): string => {
  const pad = (n: number) => (n < 10 ? '0' + n : n)
  return date.getUTCFullYear() + '-' + pad(date.getUTCMonth() + 1) + '-' + pad(date.getUTCDate())
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const sportId = validator.validated.data.sportId
  const dateString = validator.validated.data.date
  const status = validator.validated.data.status
  const date = new Date(dateString)
  if (date.toString() === 'Invalid Date') {
    throw new AdapterInputError({
      jobRunID,
      message: `Invalid date format`,
      statusCode: 400,
    })
  }
  const url = util.buildUrlPath('/sports/:sportId/events/:eventDate', {
    sportId,
    eventDate: formatDate(date),
  })

  const reqConfig: AxiosRequestConfig = {
    ...config.api,
    headers: {
      ...config.api?.headers,
      'x-rapidapi-key': config.apiKey || '',
    },
    params: {
      include: 'scores',
    },
    url,
  }

  const response = await Requester.request<ResponseSchema>(reqConfig)
  if (status !== undefined) {
    response.data.events = response.data.events.filter(
      ({ score: { event_status } }) => event_status === status,
    )
  }
  response.data.result = response.data.events

  return Requester.success(jobRunID, response, config.verbose)
}
