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
  BACKGROUND_EXECUTE_MS: {
    description: 'Milliseconds between background data refreshes',
    type: 'number',
    default: 10_000,
  },
  KMS_KEY_TTL_MS: {
    description: 'Milliseconds before a cached KMS public key is considered expired',
    type: 'number',
    default: 60_000,
  },
  KMS_REGION: {
    description: 'AWS region where the Infralabs KMS key is hosted',
    type: 'string',
    default: 'us-east-1',
  },
  AWS_ACCESS_KEY_ID: {
    description: 'AWS access key ID for KMS authentication',
    type: 'string',
    required: true,
    sensitive: true,
  },
  AWS_SECRET_ACCESS_KEY: {
    description: 'AWS secret access key for KMS authentication',
    type: 'string',
    required: true,
    sensitive: true,
  },
  KMS_VERIFICATION_DISABLED: {
    description: 'Disable KMS signature verification',
    type: 'boolean',
    default: true,
  },
})
