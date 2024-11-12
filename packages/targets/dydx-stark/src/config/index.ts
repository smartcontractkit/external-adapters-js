import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  PRIVATE_KEY: {
    description: 'The Ethereum private key used to sign the STARK_MESSAGE',
    type: 'string',
    required: true,
    sensitive: true,
  },
  STARK_MESSAGE: {
    description:
      'A constant message, determined ad hoc (for example "chainlinkStarkSig"), used in conjunction with the Ethereum PRIVATE_KEY to generate the STARK private key',
    type: 'string',
    required: true,
  },
  ORACLE_NAME: {
    description:
      'A constant name for this oracle, used as part of the data we sign using STARK private key',
    type: 'string',
    required: true,
  },
  API_ENDPOINT: {
    description: 'An API endpoint where the final signed payload will be sent',
    type: 'string',
    default: 'https://api.stage.dydx.exchange/v3/price',
  },
})
