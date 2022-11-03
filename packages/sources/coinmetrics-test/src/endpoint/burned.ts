import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { ethers } from 'ethers'
import { METRICS, TotalBurnedEndpointTypes, TotalBurnedTransport } from '../transports'

export const burnedInputParameters: InputParameters = {
  asset: {
    description:
      'The symbol of the currency to query. See [Coin Metrics Assets](https://docs.coinmetrics.io/info/assets)',
    type: 'string',
    required: true,
  },
  frequency: {
    description: 'At which interval to calculate the number of coins/tokens burned',
    type: 'string',
    required: false,
  },
}

const burnedTransport = new TotalBurnedTransport({
  prepareRequest: (input, config) => {
    const { asset, frequency } = input.requestContext.data

    const params: {
      assets: string
      metrics: string
      frequency: string
      page_size: number
      api_key: string
      next_page_token?: string
      isBurnedEndpointMode: boolean
    } = {
      assets: (asset as string).toLowerCase(),
      metrics: METRICS,
      frequency,
      page_size: 1,
      api_key: config.API_KEY as string,
      isBurnedEndpointMode: true,
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
  name: 'burned',
  transport: burnedTransport,
  inputParameters: burnedInputParameters,
})
