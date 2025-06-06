import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { parseUnits } from 'ethers'
import { BaseEndpointTypes, inputParameters } from '../endpoint/mintable'

type ReservesResponse = BitgoReservesResponse

type BitgoReservesResponse = {
  result: number
  timestamps: {
    providerDataReceivedUnixMs: number
  }
}

export const getReserve = async (
  token: string,
  reserves: 'Bitgo',
  requester: Requester,
  config: BaseEndpointTypes['Settings'],
  endpointName: string,
  transportName: string,
) => {
  const requestConfig = getRequest(token, reserves, config)
  const requestKey = calculateHttpRequestKey<BaseEndpointTypes>({
    context: {
      adapterSettings: config,
      inputParameters,
      endpointName,
    },
    data: requestConfig.data,
    transportName,
  })

  try {
    const response = await requester.request<ReservesResponse>(requestKey, requestConfig)

    return parseResponse(reserves, response.response.data)
  } catch (e) {
    if (e instanceof AdapterError) {
      e.message = `${e.message} ${JSON.stringify(e?.errorResponse) || e.name}`
    }
    throw e
  }
}

const getRequest = (token: string, _reserves: 'Bitgo', config: BaseEndpointTypes['Settings']) => {
  return {
    method: 'post',
    baseURL: config.BITGO_RESERVES_EA_URL,
    data: { data: { client: token } },
  }
}

const parseResponse = (_reserves: 'Bitgo', response: ReservesResponse) => {
  return {
    reserveAmount: parseUnits(response.result.toString(), 18),
    timestamp: response.timestamps.providerDataReceivedUnixMs,
  }
}
