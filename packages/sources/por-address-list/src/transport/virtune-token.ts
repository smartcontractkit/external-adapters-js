import { PoRTokenAddress } from '@chainlink/external-adapter-framework/adapter/por'
import {
  HttpTransport,
  HttpTransportConfig,
} from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/virtune-token'
import {
  createVirtuneTransportConfig,
  getUrl,
  ResponseSchema,
  VirtuneParams,
} from './virtune-utils'

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

type Params = VirtuneParams<HttpTransportTypes>

const getResultFromAddresses = ({
  addresses,
  params,
}: {
  addresses: string[]
  params: Params
}): PoRTokenAddress[] => {
  const { network, chainId, contractAddress } = params
  if (addresses.length === 0) {
    return []
  }
  return [
    {
      chainId,
      network,
      contractAddress,
      wallets: addresses,
    },
  ]
}

const transportConfig: HttpTransportConfig<HttpTransportTypes> =
  createVirtuneTransportConfig<HttpTransportTypes>(getUrl, getResultFromAddresses)

// Exported for testing
export class VirtuneTokenTransport extends HttpTransport<HttpTransportTypes> {
  constructor() {
    super(transportConfig)
  }
}

export const virtuneTokenTransport = new VirtuneTokenTransport()
