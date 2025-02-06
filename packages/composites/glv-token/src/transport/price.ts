import { BaseEndpointTypes } from '../endpoint/price'
import { BaseGlvTransport } from './base'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import { AdapterResponse, sleep } from '@chainlink/external-adapter-framework/util'

export class GlvPriceTransport extends BaseGlvTransport<BaseEndpointTypes> {
  async backgroundHandler(
    context: EndpointContext<BaseEndpointTypes>,
    entries: TypeFromDefinition<BaseEndpointTypes['Parameters']>[],
  ): Promise<void> {
    await Promise.all(entries.map(async (param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(param: TypeFromDefinition<BaseEndpointTypes['Parameters']>): Promise<void> {
    let response: AdapterResponse<BaseEndpointTypes['Response']>
    try {
      response = await this._handleRequest(param)
    } catch (e) {
      response = this.handleError(e)
    }
    await this.responseCache.write(this.name, [{ params: param, response }])
  }

  protected formatResponse(
    result: number,
    _minimizedValue: number,
    _maximizedValue: number,
    sources: Record<string, string[]>,
    timestamps: any,
  ): AdapterResponse<BaseEndpointTypes['Response']> {
    return {
      data: { result, sources },
      statusCode: 200,
      result,
      timestamps,
    }
  }
}

export const glvPriceTransport = new GlvPriceTransport()
