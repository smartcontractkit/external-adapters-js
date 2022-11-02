import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { ethers } from 'ethers'
import {
  DEFAULT_PAGE_SIZE,
  Frequency,
  METRICS,
  TotalBurnedEndpointTypes,
  TotalBurnedTransport,
} from '../transports'

export const totalBurnedInputParameters: InputParameters = {
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

const totalBurnedTransport = new TotalBurnedTransport({
  prepareRequest: (input, config) => {
    const { asset, frequency, pageSize, startTime, endTime } = input.requestContext.data

    const params: {
      assets: string
      metrics: string
      frequency: string
      page_size: number
      api_key: string
      start_time: string
      end_time: string
      next_page_token?: string
    } = {
      assets: (asset as string).toLowerCase(),
      metrics: METRICS,
      frequency,
      page_size: pageSize,
      api_key: config.API_KEY as string,
      start_time: startTime,
      end_time: endTime,
    }

    return {
      url: `${config.API_ENDPOINT}/timeseries/asset-metrics`,
      method: 'GET',
      params,
    }
  },
  parseResponse: (_, res, config) => {
    return {
      data: config.API_VERBOSE ? res.data : undefined,
      providerStatusCode: res.status,
      statusCode: 200,
      result: ethers.utils.formatEther(res.data.totalBurnedTKN.toString()),
    }
  },
  options: {
    requestCoalescing: {
      enabled: true,
    },
  },
})

export const endpoint = new AdapterEndpoint<TotalBurnedEndpointTypes>({
  name: 'total-burned',
  transport: totalBurnedTransport,
  inputParameters: totalBurnedInputParameters,
})
