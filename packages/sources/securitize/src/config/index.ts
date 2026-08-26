import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_KEY: {
    description: 'An API key for Securitize NAV',
    type: 'string',
    required: true,
    sensitive: true,
  },
  API_ENDPOINT: {
    description: 'The API endpoint for Securitize NAV',
    type: 'string',
    default: 'https://partners-api.securitize.io/asset-metrics/api/v1/nav',
    sensitive: false,
  },
  ASSET_PUBKEYS: {
    description:
      'The comma separated list of pubkeys to decrypt the Securitize NAV response for a given asset, where ${ASSET} is the upper-snake-case version of the asset input parameter',
    type: 'string',
    required: true,
    variablePlaceholder: 'ASSET',
    sensitive: true,
  },
})
