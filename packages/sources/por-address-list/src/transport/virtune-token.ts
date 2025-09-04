import { PoRTokenAddress } from '@chainlink/external-adapter-framework/adapter/por'
import {
  HttpTransport,
  HttpTransportConfig,
} from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/virtune-token'
import { createVirtuneTransportConfig, ResponseSchema, VirtuneParams } from './virtune-utils'
export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

type Params = VirtuneParams<HttpTransportTypes>

const getUrl = (params: Params): string => {
  return params.accountId
}

const getAddresses = ({
  data,
  params,
}: {
  data: ResponseSchema
  params: Params
}): PoRTokenAddress[] => {
  const { network, chainId, contractAddress } = params
  const wallets = data.result.flatMap((r) => r.wallets.map((w) => w.address))
  if (wallets.length === 0) {
    return []
  }
  return [
    {
      chainId,
      network,
      contractAddress,
      wallets,
    },
  ]
}

const transportConfig: HttpTransportConfig<HttpTransportTypes> =
  createVirtuneTransportConfig<HttpTransportTypes>(getUrl, getAddresses)

// Exported for testing
export class VirtuneTokenTransport extends HttpTransport<HttpTransportTypes> {
  constructor() {
    super(transportConfig)
  }
}

export const virtuneTokenTransport = new VirtuneTokenTransport()
