import { ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
export declare const config: import('@chainlink/external-adapter-framework/config').AdapterConfig<{
  API_KEY: {
    description: string
    type: 'string'
    required: true
    sensitive: true
  }
  WS_API_ENDPOINT: {
    description: string
    type: 'string'
    default: string
  }
  API_ENDPOINT: {
    description: string
    type: 'string'
    default: string
  }
}>
export declare const adapter: Adapter<{
  API_KEY: {
    description: string
    type: 'string'
    required: true
    sensitive: true
  }
  WS_API_ENDPOINT: {
    description: string
    type: 'string'
    default: string
  }
  API_ENDPOINT: {
    description: string
    type: 'string'
    default: string
  }
}>
export declare const server: () => Promise<ServerInstance | undefined>
//# sourceMappingURL=index.d.ts.map
