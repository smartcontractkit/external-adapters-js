import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_ENDPOINT: {
    description: 'An API endpoint for Go USD',
    type: 'string',
    default: 'https://reserves.gousd.com/por.json',
  },
  VERIFICATION_PUBKEY: {
    description:
      'Public RSA key used for verifying data signature for Go USD. Expected to be formatted as a single line eg: "-----BEGIN PUBLIC KEY-----\\n...contents...\\n-----END PUBLIC KEY-----"',
    type: 'string',
    default: '',
  },
  // You can additionally add ${client}_API_ENDPOINT ${client}_VERIFICATION_PUBKEY to match ${client} in EA input param
})
