import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
export declare const inputParameters: InputParameters<{
  readonly symbol: {
    readonly type: 'string'
    readonly description: 'The symbol to query (e.g., XAUM)'
    readonly required: true
  }
}>
export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}
export declare const endpoint: AdapterEndpoint<import('../transport/nav').HttpTransportTypes>
//# sourceMappingURL=nav.d.ts.map
