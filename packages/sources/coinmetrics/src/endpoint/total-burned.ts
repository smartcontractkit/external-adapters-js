import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { ethers, BigNumber } from 'ethers'
import { NAME as AdapterName } from '../config'

export interface AssetMetrics {
  asset: string
  time: string
  FeeTotNtv: string
  IssTotNtv: string
  RevNtv: string
}

export interface ResponseSchema {
  data: AssetMetrics[]
  next_page_token?: string
  next_page_url?: string
}

export const supportedEndpoints = ['total-burned']

// Common frequencies for FeeTotNtv, RevNtv and IssTotNtv metrics
export enum Frequency {
  ONE_DAY = '1d',
  ONE_BLOCK = '1b',
}

const METRICS = 'FeeTotNtv,RevNtv,IssTotNtv'
const DEFAULT_PAGE_SIZE = 10_000
const URL = 'timeseries/asset-metrics'

export const description = `Endpoint to calculate the total number of burned coins/tokens for an asset.
This endpoint requires that the asset has the following metrics available: \`FeeTotNtv\`, \`RevNtv\` and \`IssTotNtv\`.`

export type TInputParameters = {
  asset: string
  frequency: string
  pageSize: number
  startTime: string
  endTime: string
}
export const inputParameters: InputParameters<TInputParameters> = {
  asset: {
    description:
      'The symbol of the currency to query. See [Coin Metrics Assets](https://docs.coinmetrics.io/info/assets)',
    type: 'string',
    required: true,
  },
  frequency: {
    description: 'At which interval to calculate the number of coins/tokens burned',
    options: [Frequency.ONE_DAY, Frequency.ONE_BLOCK],
    type: 'string',
    required: false,
    default: Frequency.ONE_DAY,
  },
  pageSize: {
    description: 'Number of results to get per page. From 1 to 10000',
    default: DEFAULT_PAGE_SIZE,
    type: 'number',
    required: false,
  },
  startTime: {
    description:
      'The start time for the queried period. See [Supported DateTime Formats](#supported-datetime-formats)',
    type: 'string',
    required: false,
  },
  endTime: {
    description:
      'The end time for the queried period. See [Supported DateTime Formats](#supported-datetime-formats)',
    type: 'string',
    required: false,
  },
}

export const calculateBurnedTKN = (assetMetricsList: AssetMetrics[]): BigNumber => {
  let burnedTKN = BigNumber.from('0')
  assetMetricsList.forEach((assetMetrics: AssetMetrics) => {
    let feeTotNTV
    let revNtv
    let issTotNtv
    try {
      feeTotNTV = ethers.utils.parseEther(assetMetrics.FeeTotNtv)
      revNtv = ethers.utils.parseEther(assetMetrics.RevNtv)
      issTotNtv = ethers.utils.parseEther(assetMetrics.IssTotNtv)
    } catch (error) {
      throw new Error(
        `Unprocessable asset metrics: ${JSON.stringify(assetMetrics)}, due to: ${error}.`,
      )
    }
    burnedTKN = burnedTKN.add(feeTotNTV.sub(revNtv.sub(issTotNtv)))
  })
  return burnedTKN
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator<TInputParameters>(request, inputParameters)

  const jobRunID = validator.validated.id
  const asset = validator.overrideSymbol(AdapterName, validator.validated.data.asset)
  const frequency = validator.validated.data.frequency
  const pageSize = validator.validated.data.pageSize
  const startTime = validator.validated.data.startTime
  const endTime = validator.validated.data.endTime

  const params = {
    assets: (asset as string).toLowerCase(),
    metrics: METRICS,
    frequency,
    page_size: pageSize,
    api_key: config.apiKey as string,
    start_time: startTime,
    end_time: endTime,
    next_page_token: '',
  }
  const options = { ...config.api, params, url: URL }

  let totalBurnedTKN = BigNumber.from('0')
  let response
  /*eslint no-constant-condition: ["error", { "checkLoops": false }]*/
  while (true) {
    response = await Requester.request<ResponseSchema>(options)

    const responseData = response.data
    const { data: assetMetricsList } = responseData
    if (!Array.isArray(assetMetricsList)) {
      throw new Error(
        `Unexpected response: ${JSON.stringify(assetMetricsList)}. 'data' expected to be an array.`,
      )
    }
    totalBurnedTKN = totalBurnedTKN.add(calculateBurnedTKN(assetMetricsList))

    const nextPageToken = response.data.next_page_token
    if (!nextPageToken || assetMetricsList.length < pageSize || request.data.isBurnedEndpointMode)
      break
    options.params.next_page_token = nextPageToken
  }

  return Requester.success(
    jobRunID,
    Requester.withResult(response, ethers.utils.formatEther(totalBurnedTKN.toString())),
    config.verbose,
  )
}
