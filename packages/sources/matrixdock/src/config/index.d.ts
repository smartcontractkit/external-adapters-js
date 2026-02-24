import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
export declare const config: AdapterConfig<{
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
//# sourceMappingURL=index.d.ts.map
