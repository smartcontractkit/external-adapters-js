import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  MEMBERS_ENDPOINT: {
    description: 'wBTC endpoint of members (and their addresses). Required for members endpoint',
    type: 'string',
  },
  ADDRESSES_ENDPOINT: {
    description: 'wBTC endpoint of addresses.  Required for addresses endpoint',
    type: 'string',
  },
})
