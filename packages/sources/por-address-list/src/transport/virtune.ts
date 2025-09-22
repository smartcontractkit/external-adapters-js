import { PoRAddress } from '@chainlink/external-adapter-framework/adapter/por'
import {
  HttpTransport,
  HttpTransportConfig,
} from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/virtune'
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
}): PoRAddress[] => {
  const { network, chainId } = params
  return addresses.map((address) => ({
    address,
    network,
    chainId,
  }))
}

const transportConfig: HttpTransportConfig<HttpTransportTypes> =
  createVirtuneTransportConfig<HttpTransportTypes>(getUrl, getResultFromAddresses)

// Exported for testing
export class VirtuneTransport extends HttpTransport<HttpTransportTypes> {
  constructor() {
    super(transportConfig)
  }
}

export const virtuneTransport = new VirtuneTransport()
