import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
export declare const inputParameters: InputParameters<{
  readonly chainType: {
    readonly type: 'string'
    readonly description: 'The chain type (e.g., polygon, sui)'
    readonly required: true
  }
  readonly tokenName: {
    readonly type: 'string'
    readonly description: 'The token name (e.g., rcusdp)'
    readonly required: true
  }
}>
export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse & {
    Data: {
      navPerShare: number
      aum: number
      navDate: string
    }
  }
  Settings: typeof config.settings
}
export declare const endpoint: AdapterEndpoint<import('../transport/nav').HttpTransportTypes>
//# sourceMappingURL=nav.d.ts.map
