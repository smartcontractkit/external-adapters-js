import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

// TODO change to prod default once ready
export const STAGING_USHP_API_ENDPOINT = 'https://ushp-index-interface.staging.infralabs.xyz/index'

export const config = new AdapterConfig({
  API_KEY: {
    description: 'Infralabs API key (shared across all endpoints)',
    type: 'string',
    required: true,
    sensitive: true,
  },
  USHP_API_ENDPOINT: {
    description: 'Infralabs USHP index API URL',
    type: 'string',
    default: STAGING_USHP_API_ENDPOINT,
  },
  USHP_MAX_STALENESS_SECS: {
    description: 'Maximum age in seconds for the USHP index value before it is considered stale',
    type: 'number',
    default: 3_600_000,
  },
  INFRALABS_PUBLIC_KEYS: {
    description:
      'JSON array of PEM-encoded public keys used to verify Infralabs response signatures. ' +
      'List multiple keys during a rotation window (old + new) for zero-downtime rotation — ' +
      'a response is accepted if it verifies against any configured key.',
    type: 'string',
    required: true,
    sensitive: false,
  },
})
