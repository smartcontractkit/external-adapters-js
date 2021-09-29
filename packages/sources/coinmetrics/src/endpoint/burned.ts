import { Requester, Validator, AdapterError } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { NAME as AdapterName } from '../config'

export const DEFAULT_FREQUENCY = '1d'

export const supportedEndpoints = ['burned']

export const DEFAULT_STARTDATE = '2021-06-13'

export interface ResponseSchema {
  data: [
    {
      asset: string
      time: string
      FeeTotNtv: string
      IssTotNtv: string
      RevNtv: string
    },
  ]
  next_page_token: string
  next_page_url: string
}

export interface Day {
  asset: string
  time: string
  FeeTotNtv: string
  IssTotNtv: string
  RevNtv: string
}

export const inputParameters: InputParameters = {
  asset: true,
  frequency: false,
  pageSize: false,
  startDate: false,
  endDate: false,
}

const throwAdapterError = (jobRunID: string, message: string, statusCode = 500) => {
  throw new AdapterError({
    jobRunID,
    message,
    statusCode,
  })
}

const reDate = new RegExp(/^\d{4}-\d{2}-\d{2}$/)

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const asset = validator.overrideSymbol(AdapterName, validator.validated.data.asset)
  const frequency = validator.validated.data.frequency || DEFAULT_FREQUENCY
  const startDate = validator.validated.data.startDate || DEFAULT_STARTDATE
  const endDate = validator.validated.data.endDate

  if (startDate && !reDate.test(startDate)) {
    throwAdapterError(
      jobRunID,
      `Invalid 'startDate': ${startDate}. Expected formats is: YYYY-MM-DD`,
      400,
    )
  }

  if (endDate && !reDate.test(endDate)) {
    throwAdapterError(
      jobRunID,
      `Invalid 'endDate': ${endDate}. Expected formats is: YYYY-MM-DD`,
      400,
    )
  }

  if (startDate && endDate && Date.parse(startDate) > Date.parse(endDate)) {
    throwAdapterError(
      jobRunID,
      `'startDate': ${startDate} cannot be greater than 'endDate': ${endDate}`,
      400,
    )
  }

  if (startDate && Date.parse(startDate) < Date.parse(DEFAULT_STARTDATE)) {
    throwAdapterError(
      jobRunID,
      `'startDate': ${startDate} should be greater or equal to ${DEFAULT_STARTDATE}`,
      400,
    )
  }

  if (endDate && Date.parse(endDate) <= Date.parse(DEFAULT_STARTDATE)) {
    throwAdapterError(
      jobRunID,
      `'endDate': ${endDate} should be greater than ${DEFAULT_STARTDATE}`,
      400,
    )
  }

  const url = 'timeseries/asset-metrics'
  const metrics = 'FeeTotNtv,RevNtv,IssTotNtv'

  let totalBurned = 0

  let nextPageToken = ''

  const params = {
    assets: (asset as string).toLowerCase(),
    metrics,
    frequency,
    page_size: 10,
    start_time: startDate,
    end_time: endDate,
    api_key: config.apiKey,
  }

  const options = { ...config.api, params, url }

  const response = await Requester.request<ResponseSchema>(options)

  if (response.data.next_page_token) {
    response.data.data.forEach((day: Day) => {
      const burnedEth: number =
        parseFloat(day.FeeTotNtv) - (parseFloat(day.RevNtv) - parseFloat(day.IssTotNtv))
      totalBurned += burnedEth
    })

    let flag = 1

    nextPageToken = response.data.next_page_token

    while (flag == 1) {
      const params = {
        assets: (asset as string).toLowerCase(),
        metrics,
        frequency,
        page_size: 10,
        next_page_token: nextPageToken,
        start_time: startDate,
        end_time: endDate,
        api_key: config.apiKey,
      }

      const options = { ...config.api, params, url }

      const newResponse = await Requester.request<ResponseSchema>(options)

      newResponse.data.data.forEach((day: Day) => {
        const burnedEth: number =
          parseFloat(day.FeeTotNtv) - (parseFloat(day.RevNtv) - parseFloat(day.IssTotNtv))
        totalBurned += burnedEth
      })

      if (!newResponse.data.next_page_token) {
        flag = 0
      } else {
        nextPageToken = newResponse.data.next_page_token
      }
    }
  }

  const result = totalBurned

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
