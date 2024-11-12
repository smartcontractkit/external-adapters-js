import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { IncludesFile } from '@chainlink/external-adapter-framework/adapter'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { commodities, crypto, eod, etf, forex, stock, ukEtf } from './endpoint'
import { PriceEndpointInputParametersDefinition } from '@chainlink/external-adapter-framework/adapter/price'
import { AdapterParams } from '@chainlink/external-adapter-framework/adapter/types'
import {
  AdapterRequest,
  AdapterRequestContext,
  AdapterResponse,
} from '@chainlink/external-adapter-framework/util'
import { CustomSettingsDefinition } from '@chainlink/external-adapter-framework/config'

export type PriceAdapterRequest<T> = AdapterRequest<T> & {
  requestContext: AdapterRequestContext<T> & {
    priceMeta: {
      inverse: boolean
    }
  }
}

class FinageAdapter<T extends CustomSettingsDefinition> extends PriceAdapter<T> {
  constructor(
    params: AdapterParams<T> & {
      includes?: IncludesFile
    },
  ) {
    super(params)

    if (params.includes) {
      throw Error(
        'Includes.json cannot be used for inverse behavior due to alternate implementation. See endpoint/forex.ts',
      )
    }
  }

  override async handleRequest(
    req: PriceAdapterRequest<PriceEndpointInputParametersDefinition>,
    replySent: Promise<unknown>,
  ): Promise<AdapterResponse> {
    /* 
    overrides PriceAdapter.handleRequest [https://github.com/smartcontractkit/ea-framework-js/blob/main/src/adapter/price.ts#L160] 
    to implement inverse behavior for forex endpoint see: endpoint/forex.ts/excludesMap
    
    */
    const response = await super.handleRequest(req, replySent)

    if (req.requestContext.endpointName == this.endpointsMap.forex.name) {
      if (req.requestContext.priceMeta.inverse) {
        // Deep clone the response, as it may contain objects which won't be cloned by simply destructuring
        const cloneResponse = JSON.parse(JSON.stringify(response))

        const inverseResult = 1 / (cloneResponse.result as number)
        cloneResponse.result = inverseResult
        // Check if response data has a result within it
        const data = cloneResponse.data as { result: number } | null
        if (data?.result) {
          data.result = inverseResult
        }
        return cloneResponse
      }
    }

    return response
  }
}

export const adapter = new FinageAdapter({
  defaultEndpoint: stock.name,
  name: 'FINAGE',
  config,
  endpoints: [crypto, stock, eod, commodities, forex, ukEtf, etf],
  rateLimiting: {
    tiers: {
      professionalstocksusstockmarket: {
        rateLimit1s: 100,
        note: 'Considered unlimited tier, but setting reasonable limits',
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
