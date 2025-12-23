import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { AdapterResponse, sleep } from '@chainlink/external-adapter-framework/util'
import { GlvPriceEndpointTypes } from '../endpoint/glv-price'
import { BaseGlvTransport, GlvTransportParams } from './glv-base'

export class GlvPriceTransport extends BaseGlvTransport {
  async backgroundHandler(
    context: EndpointContext<GlvPriceEndpointTypes>,
    entries: GlvTransportParams[],
  ): Promise<void> {
    await Promise.all(entries.map(async (param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(param: GlvTransportParams): Promise<void> {
    let response: AdapterResponse<GlvPriceEndpointTypes['Response']>
    try {
      response = await this._handleRequest(param)
    } catch (e) {
      response = this.handleError(e)
    }
    await this.responseCache.write(this.name, [{ params: param, response }])
  }

  protected formatResponse(
    result: number,
    minimizedValue: number,
    maximizedValue: number,
    sources: Record<string, string[]>,
    timestamps: any,
  ): AdapterResponse<GlvPriceEndpointTypes['Response']> {
    return {
      data: {
        result: result,
        mid: result,
        bid: minimizedValue,
        ask: maximizedValue,
        sources,
      },
      statusCode: 200,
      result: result,
      timestamps,
    }
  }
}

export const glvPriceTransport = new GlvPriceTransport()
