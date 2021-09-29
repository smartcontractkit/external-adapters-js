import { Requester, Validator, AdapterError } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { Decimal } from 'decimal.js'
Decimal.set({ precision: 100 })

export const supportedEndpoints = ['burned']

const METRICS = 'FeeTotNtv,RevNtv,IssTotNtv'
const ASSETS = 'eth'
const FREQUENCY = '1d' // Common and safe frequency for total ETH burned via FeeTotNtv, RevNtv and IssTotNtv
const DEFAULT_PAGE_SIZE = 10_000
// NB: first API ETH metric is from the 2021-06-21. Any ETH metrics before DEFAULT_START_DATE report 0 ETH burned.
const DEFAULT_START_DATE = '2021-08-05' // EIP-1559 release date

const URL = 'timeseries/asset-metrics'

interface AssetMetrics {
  asset: string
  time: string
  FeeTotNtv: string
  IssTotNtv: string
  RevNtv: string
}

interface ResponseData {
  data: AssetMetrics[]
  next_page_token?: string
  next_page_url?: string
}

export const inputParameters: InputParameters = {
  startDate: false,
  endDate: false,
}

const reDate = new RegExp(/^\d{4}-\d{2}-\d{2}$/)

const calculateBurnedETH = (jobRunID: string, assetMetricsList: AssetMetrics[]): Decimal => {
  let burnedETH = new Decimal(0)
  assetMetricsList.forEach((assetMetrics: AssetMetrics) => {
    let feeTotNTV
    let revNtv
    let issTotNtv
    try {
      feeTotNTV = new Decimal(assetMetrics.FeeTotNtv)
      revNtv = new Decimal(assetMetrics.RevNtv)
      issTotNtv = new Decimal(assetMetrics.IssTotNtv)
    } catch (error) {
      throw new AdapterError({
        jobRunID,
        message: `Unprocessable asset metrics: ${JSON.stringify(assetMetrics)}, due to: ${error}.`,
        statusCode: 400,
      })
    }
    burnedETH = burnedETH.plus(feeTotNTV.minus(revNtv.minus(issTotNtv)))
  })
  return burnedETH
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const today = new Date().toISOString().split('T')[0]

  const jobRunID = validator.validated.id
  const startDate = validator.validated.data.startDate || DEFAULT_START_DATE
  const endDate = validator.validated.data.endDate || today

  if (startDate && !reDate.test(startDate)) {
    throw new AdapterError({
      jobRunID,
      message: `Invalid 'startDate': ${startDate}. Expected formats is: YYYY-MM-DD.`,
      statusCode: 400,
    })
  }

  if (Date.parse(startDate) > Date.parse(today)) {
    throw new AdapterError({
      jobRunID,
      message: `Invalid 'startDate': ${startDate}. Is greater than today: ${today}.`,
      statusCode: 400,
    })
  }

  if (!reDate.test(endDate)) {
    throw new AdapterError({
      jobRunID,
      message: `Invalid 'endDate': ${endDate}. Expected formats is: YYYY-MM-DD.`,
      statusCode: 400,
    })
  }

  if (Date.parse(endDate) > Date.parse(today)) {
    throw new AdapterError({
      jobRunID,
      message: `Invalid 'endDate': ${endDate}. Is greater than today: ${today}.`,
      statusCode: 400,
    })
  }

  if (Date.parse(startDate) > Date.parse(endDate)) {
    throw new AdapterError({
      jobRunID,
      message: `Invalid date range: 'startDate': ${startDate} cannot be greater than 'endDate': ${endDate}.`,
      statusCode: 400,
    })
  }

  const params = {
    assets: ASSETS,
    metrics: METRICS,
    frequency: FREQUENCY,
    page_size: DEFAULT_PAGE_SIZE,
    start_time: startDate,
    end_time: endDate,
    api_key: config.apiKey,
  }

  const options = { ...config.api, params, url: URL }

  let totalBurnedETH = new Decimal(0)
  let response
  /*eslint no-constant-condition: ["error", { "checkLoops": false }]*/
  while (true) {
    response = await Requester.request(options)

    const responseData: ResponseData = response.data
    const { data: assetMetricsList } = responseData
    if (!Array.isArray(assetMetricsList)) {
      throw new AdapterError({
        jobRunID,
        message: `Unexpected response: ${assetMetricsList}. 'data' expected to be an array.`,
        statusCode: 400,
      })
    }
    totalBurnedETH = totalBurnedETH.plus(calculateBurnedETH(jobRunID, assetMetricsList))

    const nextPageToken = response.data.next_page_token
    if (!nextPageToken || assetMetricsList.length < DEFAULT_PAGE_SIZE) break
    options.params.next_page_token = nextPageToken
  }

  return Requester.success(
    jobRunID,
    Requester.withResult(response, totalBurnedETH.toString()),
    config.verbose,
  )
}
