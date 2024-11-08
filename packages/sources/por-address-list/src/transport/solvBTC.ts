import { BaseEndpointTypes } from '../endpoint/address'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { throwApiNoAddressError } from './utils'

interface ResponseSchema {
  accountName: string
  result: {
    id: number
    address: string
    symbol: string
    addressType: string
    walletName: string
  }[]
  count: number
  lastUpdatedAt: string
}

export const handleSolvRequest = async (
  settings: BaseEndpointTypes['Settings'],
  requester: Requester,
) => {
  const providerDataRequestedUnixMs = Date.now()

  const requestConfig = {
    url: settings.SOLVBTC_API_ENDPOINT,
    method: 'GET',
  }

  const response = await requester.request<ResponseSchema>(
    JSON.stringify(requestConfig),
    requestConfig,
  )

  if (!response.response.data || response.response.data.result.length == 0) {
    throwApiNoAddressError('solvBTC', providerDataRequestedUnixMs)
  }

  const addresses = response.response.data.result
    .map((r) => ({
      address: r.address,
      network: 'bitcoin',
      chainId: 'mainnet',
    }))
    .sort()

  return {
    data: {
      searchLimboValidators: undefined,
      result: addresses,
    },
    statusCode: 200,
    result: null,
    timestamps: {
      providerDataRequestedUnixMs,
      providerDataReceivedUnixMs: Date.now(),
      providerIndicatedTimeUnixMs: new Date(response.response.data.lastUpdatedAt).getTime(),
    },
  }
}
