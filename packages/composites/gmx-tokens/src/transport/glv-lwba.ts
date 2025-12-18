import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { AdapterResponse, sleep } from '@chainlink/external-adapter-framework/util'
import { GlvLwbaEndpointTypes } from '../endpoint/glv-lwba'
import { BaseGlvTransport, GlvTransportParams } from './glv-base'

export class GlvLwbaTransport extends BaseGlvTransport<GlvLwbaEndpointTypes> {
  async backgroundHandler(
    context: EndpointContext<GlvLwbaEndpointTypes>,
    entries: GlvTransportParams<GlvLwbaEndpointTypes>[],
  ): Promise<void> {
    await Promise.all(entries.map(async (param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(param: GlvTransportParams<GlvLwbaEndpointTypes>) {
    const response = await this._handleRequest(param).catch((e) => this.handleError(e))
    await this.responseCache.write(this.name, [{ params: param, response }])
  }

  protected formatResponse(
    result: number,
    minimizedValue: number,
    maximizedValue: number,
    sources: Record<string, string[]>,
    timestamps: any,
  ): AdapterResponse<GlvLwbaEndpointTypes['Response']> {
    return {
      data: {
        mid: result,
        bid: minimizedValue,
        ask: maximizedValue,
        sources,
      },
      statusCode: 200,
      result: null,
      timestamps,
    }
  }
}

export const glvLwbaTransport = new GlvLwbaTransport()
