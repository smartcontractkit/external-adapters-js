import { ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
export declare const adapter: Adapter<{
  API_KEY: {
    description: string
    type: 'string'
    required: true
    sensitive: true
  }
  API_SECRET: {
    description: string
    type: 'string'
    required: true
    sensitive: true
  }
  API_ENDPOINT: {
    description: string
    type: 'string'
    default: string
  }
}>
export declare const server: () => Promise<ServerInstance | undefined>
//# sourceMappingURL=index.d.ts.map
