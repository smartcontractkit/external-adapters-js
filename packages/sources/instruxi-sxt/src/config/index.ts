import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_ENDPOINT: {
    description: 'An API endpoint for Data Provider',
    type: 'string',
    default: 'https://proxy.api.spaceandtime.app/v1/sql',
  },
  API_KEY: {
    description: 'An API key for Data Provider',
    type: 'string',
    sensitive: true,
    default: '3617df90-12fc-41c0-bbed-42c9706f5201',
  },
  BISCUIT_ATTESTATIONS: {
    description: 'Access biscuit for attestations table',
    type: 'string',
    sensitive: true,
    default:
      'EqIBCjgKDnN4dDpjYXBhYmlsaXR5CgEqChBpZG0uYXR0ZXN0YXRpb25zGAMiDwoNCIAIEgMYgQgSAxiCCBIkCAASIJrDjhBplULaxboqsk1gvZ4mWl1ZwWTsRm8CUt_yhmAcGkCA1XvLq3VVTG0kF2ZHl5DtKhzf4hWADqKe7AteW5YSlMc2GrXjAo3SAMJhkZ0HHGWkePlqi3MRRmfxhGMqrH8LIiIKIHPTbIWrHehPpUiLZ3iBuaCneXOWXr-Upkfk7i3giJjF',
  },
  BISCUIT_BLOCKCHAINS: {
    description: 'Access biscuit for blockchains table',
    type: 'string',
    sensitive: true,
    default:
      'EqEBCjcKDnN4dDpjYXBhYmlsaXR5CgEqCg9pZG0uYmxvY2tjaGFpbnMYAyIPCg0IgAgSAxiBCBIDGIIIEiQIABIgpUVvhN46wRz6HHp60PgooFcvFSHPbAz6Ihng1wC2BwkaQKS0RV5ZF4UDz6icQ1Sg0jYGV300nzS0U5cKFNQaUsPNMTBOYgUnmhFlnwj6N3vZlOteAIuc7Np52uKI9RKjqgIiIgogvLSVaWnYSqcteabz6p9lF6UvbiRUfZjN6VFmP3Bd-FM=',
  },
  CHAIN_ID: {
    description: 'Specify a chain ID',
    type: 'string',
    sensitive: true,
    default: '43113',
  },
  ASSET_CONTRACT_ADDRESS: {
    type: 'string',
    description: 'NFT contract address associated witht the coin',
    sensitive: true,
    default: '0xFa11d66488D1C29d36ef39426938B949822e3FBd',
  },
  TOKEN_CONTRACT_ADDRESS: {
    type: 'string',
    description: 'NFT contract address associated witht the coin',
    sensitive: true,
    default: '0x7fe755a1dc20eC83Af545bc355ad7a9564805fA9',
  },
  NAMESPACE: {
    type: 'string',
    description: 'SxT nasmespace',
    sensitive: true,
    default: 'INSTRUXI',
  },
})
