import { PoRAddress } from '@chainlink/external-adapter-framework/adapter/por'
import {
  HttpTransport,
  HttpTransportConfig,
} from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes } from '../endpoint/virtune'
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

const getAddresses = ({ data, params }: { data: ResponseSchema; params: Params }): PoRAddress[] => {
  const { network, chainId } = params
  return data.result.flatMap((r) =>
    r.wallets.map((wallet) => ({
      address: wallet.address,
      network,
      chainId,
    })),
  )
}

const transportConfig: HttpTransportConfig<HttpTransportTypes> =
  createVirtuneTransportConfig<HttpTransportTypes>(getUrl, getAddresses)

// Exported for testing
export class VirtuneTransport extends HttpTransport<HttpTransportTypes> {
  constructor() {
    super(transportConfig)
  }
}

export const virtuneTransport = new VirtuneTransport()
