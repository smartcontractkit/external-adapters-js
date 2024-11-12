import {
  AdapterError,
  AdapterConfigError,
  AdapterInputError,
  Requester,
  Validator,
} from '@chainlink/ea-bootstrap'
import {
  AdapterResponse,
  ExecuteWithConfig,
  ExecuteFactory,
  InputParameters,
} from '@chainlink/ea-bootstrap'
import { getPriceProvider } from './dataProvider'
import { Config, makeConfig } from './config'
import { Decimal } from 'decimal.js'

Decimal.set({ precision: 100 })

export type TInputParameters = {
  from: string
  to: string
  source?: string
  fromDate?: string
  toDate?: string
  days?: string
  interval?: string
}

const inputParameters: InputParameters<TInputParameters> = {
  from: {
    required: true,
    aliases: ['base', 'coin'],
  },
  to: {
    required: true,
    aliases: ['quote', 'market'],
  },
  source: {
    required: false,
  },
  fromDate: {
    required: false,
  },
  toDate: {
    required: false,
  },
  days: {
    required: false,
  },
  interval: {
    required: false,
  },
}

export const execute: ExecuteWithConfig<Config, TInputParameters> = async (
  input,
  _,
  config,
): Promise<AdapterResponse> => {
  const validator = new Validator(input, inputParameters)

  const jobRunID = validator.validated.id

  const from = validator.validated.data.from
  const to = validator.validated.data.to
  const source = (validator.validated.data.source || config.defaultSource || '').toLowerCase()
  if (source === '') {
    throw new AdapterConfigError({
      statusCode: 400,
      message: 'No source provided in request or the DEFAULT_SOURCE env var!',
    })
  }
  if (!(source in config.sources)) {
    throw new AdapterConfigError({
      statusCode: 400,
      message: `The ADAPTER_URL has not been configured for source ${source}`,
    })
  }

  const fromDateInput = validator.validated.data.fromDate
  const toDateInput = validator.validated.data.toDate
  const days = validator.validated.data.days
  const interval = validator.validated.data.interval as string
  // TODO: non-nullable default types

  const { fromDate, toDate } = getFromToDates(fromDateInput, toDateInput, days)

  const apiOptions = config.sources[source].api
  if (!apiOptions)
    throw new AdapterError({
      statusCode: 400,
      message: `${source} configuration not found`,
    })
  const provider = getPriceProvider(source, jobRunID, apiOptions)
  const providerResponse = await provider(from, to, fromDate, toDate, interval)
  const result = providerResponse
    .reduce((sum, elem) => sum.add(elem.price), new Decimal(0))
    .div(providerResponse.length)

  const response = {
    data: providerResponse,
    status: 200,
    statusText: 'success',
    headers: {},
    config: {},
  }
  return Requester.success(
    jobRunID,
    Requester.withResult(response, result.toNumber()),
    config.verbose,
  )
}

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Get the from & to date from a set of optional params
 * @example
 * // returns (startDate, toDate)
 * getFromToDates(startDate, toDate, 5);
 * @example
 * // returns (toDate - 5 days, toDate)
 * getFromToDates(undefined, toDate, 5);
 * @example
 * // returns (startDate, startDate + 5 days)
 * getFromToDates(startDate, undefined, 5);
 * @returns { fromDate: Date, toDate: Date } Returns the from/to dates.
 */
export const getFromToDates = (
  from?: string,
  to?: string,
  days?: string | number,
): { fromDate: Date; toDate: Date } => {
  if (from && to) {
    const fromDate = new Date(from)
    const toDate = new Date(to)
    if (fromDate >= toDate) {
      throw new AdapterInputError({
        statusCode: 400,
        message: 'The "fromDate" must be before the "toDate"',
      })
    }

    return { fromDate, toDate }
  } else if (!days) {
    throw new AdapterInputError({
      statusCode: 400,
      message: 'Missing either from/to dates and days param',
    })
  }
  const numDays = Number(days)
  if (numDays <= 0) {
    throw new AdapterInputError({
      statusCode: 400,
      message: 'The days param is less than or equal to 0',
    })
  }

  if (from) {
    const fromDate = new Date(from)
    const toDate = addDays(fromDate, numDays)
    return { fromDate, toDate }
  } else if (to) {
    const toDate = new Date(to)
    const fromDate = addDays(toDate, -numDays)
    return { fromDate, toDate }
  }

  throw new AdapterInputError({
    statusCode: 400,
    message: 'Missing both from/to dates',
  })
}

export const makeExecute: ExecuteFactory<Config, TInputParameters> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}
