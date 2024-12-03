import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
export declare const DEFAULT_BASE_URL_VALUE =
  'https://fund-admin-data-adapter-v1-960005989691.europe-west2.run.app'
export declare const DEFAULT_NAV_URL_VALUE = '/api/v1/nav/'
export declare const DEFAULT_RESERVE_URL_VALUE = '/api/v1/reserve/'
export declare const config: AdapterConfig<{
  API_KEY: {
    description: string
    type: 'string'
    required: true
    sensitive: true
  }
  API_BASE_URL: {
    description: string
    type: 'string'
    default: string
  }
  API_NAV_ENDPOINT: {
    description: string
    type: 'string'
    default: string
  }
  API_RESERVE_ENDPOINT: {
    description: string
    type: 'string'
    default: string
  }
}>
//# sourceMappingURL=index.d.ts.map
