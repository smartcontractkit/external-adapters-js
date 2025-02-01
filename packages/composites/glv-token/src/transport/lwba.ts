import { BaseGlvTransport } from './base'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import { AdapterResponse, sleep } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypesLwba } from '../endpoint/lwba'

export class GlvLwbaTransport extends BaseGlvTransport<BaseEndpointTypesLwba> {
  async backgroundHandler(
    context: EndpointContext<BaseEndpointTypesLwba>,
    entries: TypeFromDefinition<BaseEndpointTypesLwba['Parameters']>[],
  ): Promise<void> {
    await Promise.all(entries.map(async (param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(
    param: TypeFromDefinition<BaseEndpointTypesLwba['Parameters']>,
  ): Promise<void> {
    const response = await this._handleRequest(param).catch((e) => this.handleError(e))
    await this.responseCache.write(this.name, [{ params: param, response }])
  }

  protected formatResponse(
    result: number,
    minimizedValue: number,
    maximizedValue: number,
    sources: Record<string, string[]>,
    timestamps: any,
  ): AdapterResponse<BaseEndpointTypesLwba['Response']> {
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
