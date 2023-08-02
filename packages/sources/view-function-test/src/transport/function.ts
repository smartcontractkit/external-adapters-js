import { Transport, TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterRequest, AdapterResponse } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes, inputParameters } from '../endpoint/function'
import { ethers, utils } from 'ethers'

export type FunctionTransportTypes = BaseEndpointTypes

export class FunctionTransport implements Transport<FunctionTransportTypes> {
  name!: string
  responseCache!: ResponseCache<FunctionTransportTypes>
  requester!: Requester

  async initialize(
    dependencies: TransportDependencies<FunctionTransportTypes>,
    _adapterSettings: FunctionTransportTypes['Settings'],
    _endpointName: string,
    transportName: string,
  ): Promise<void> {
    this.responseCache = dependencies.responseCache
    this.requester = dependencies.requester
    this.name = transportName
  }

  async foregroundExecute(
    req: AdapterRequest<typeof inputParameters.validated>,
    settings: FunctionTransportTypes['Settings'],
  ): Promise<AdapterResponse<FunctionTransportTypes['Response']>> {
    const { address, signature, inputParams } = req.requestContext.data

    const provider = new ethers.providers.JsonRpcProvider(
      settings.ETHEREUM_RPC_URL,
      settings.ETHEREUM_CHAIN_ID,
    )

    const iface = new utils.Interface([signature])
    const fnName = iface.functions[Object.keys(iface.functions)[0]].name

    const encoded = iface.encodeFunctionData(fnName, [...(inputParams || [])])

    const providerDataRequestedUnixMs = Date.now()
    const result = await provider.call({
      to: address,
      data: encoded,
    })

    const response = {
      data: {
        result,
      },
      statusCode: 200,
      result,
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    }
    await this.responseCache.write(this.name, [
      {
        params: req.requestContext.data,
        response,
      },
    ])

    return response
  }
}

export const functionTransport = new FunctionTransport()
