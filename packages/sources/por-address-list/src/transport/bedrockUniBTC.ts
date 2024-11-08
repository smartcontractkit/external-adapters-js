import { BaseEndpointTypes } from '../endpoint/address'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { throwApiNoAddressError } from './utils'

interface ResponseSchema {
  btc: string[]
  evm: {
    [key: string]: string
  }
}

export const handleBedrockRequest = async (
  settings: BaseEndpointTypes['Settings'],
  requester: Requester,
) => {
  const providerDataRequestedUnixMs = Date.now()

  const requestConfig = {
    url: settings.BEDROCK_UNIBTC_API_ENDPOINT,
    method: 'GET',
  }

  const response = await requester.request<ResponseSchema>(
    JSON.stringify(requestConfig),
    requestConfig,
  )

  if (!response.response.data || response.response.data.btc.length == 0) {
    throwApiNoAddressError('bedrockUniBtc', providerDataRequestedUnixMs)
  }

  const addresses = response.response.data.btc
    .map((adr) => ({
      address: adr,
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
      providerIndicatedTimeUnixMs: undefined,
    },
  }
}
