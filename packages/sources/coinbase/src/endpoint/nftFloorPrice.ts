import { Requester, Validator } from '@chainlink/ea-bootstrap'
import type { ExecuteWithConfig, Config, InputParameters } from '@chainlink/ea-bootstrap'

export const supportedEndpoints = ['nft-floor', 'nft-floor-price']

export const description =
  'Get NFT floor price for a given network, contractAddress & metricName. Note: metricName defaults to ETH_FLOOR_PRICE_ESTIMATE_BASE; if you want to use a different metricName, you should also supply a custom resultPath'

export type TInputParameters = {
  network?: string
  contractAddress: string
  metricName?: string
}
export const inputParameters: InputParameters<TInputParameters> = {
  network: {
    required: false,
    description: 'The blockchain network to get data from',
    default: 'ethereum-mainnet',
    type: 'string',
    options: ['ethereum-mainnet', 'polygon-mainnet'],
  },
  contractAddress: {
    description: 'The NFT contract address',
    type: 'string',
    required: true,
  },
  metricName: {
    description: 'The metric name to query',
    type: 'string',
    default: 'ETH_FLOOR_PRICE_ESTIMATE_BASE',
  },
}

export interface ResponseSchema {
  floorPriceDailyValue: [
    {
      date: string
      multiplier: number
      priceStdDev: number
      logFloorPrice: number
      adjustedFloorPrice: number
    },
  ]
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const networkName = validator.validated.data.network
  const contractAddress = validator.validated.data.contractAddress
  const metricName = validator.validated.data.metricName
  const resultPath = validator.validated.data.resultPath

  const baseURL = `${config.adapterSpecificParams?.nftBaseURL}/api/nft/quant/v1/GetCollectionLatestMetric`
  const params = {
    networkName,
    contractAddress,
    metricName,
  }

  const options = {
    ...config.api,
    headers: {
      ...(config.api?.headers || {}),
    },
    baseURL,
    params,
  }
  if (config.adapterSpecificParams?.nftApiAuthHeader)
    options.headers['CB-NFT-API-TOKEN'] = String(config.adapterSpecificParams?.nftApiAuthHeader)
  const response = await Requester.request<ResponseSchema>(options)
  const result = Requester.validateResultNumber(
    response.data,
    resultPath || ['value', 'floor_price_estimate'],
  )
  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
