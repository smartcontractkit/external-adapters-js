export const ENV_API_TIMEOUT = 'API_TIMEOUT'

export const ENDPOINT_MAIN = 'https://blockchain.info/'
export const ENDPOINT_TEST = 'https://testnet.blockchain.info/'

export const DEFAULT_TIMEOUT = 30000
export const DEFAULT_CONFIRMATIONS = 6
export const DEFAULT_ENDPOINT = 'balance'

export type Config = {
  api: Record<string, unknown>
}

export type CoinType = 'btc'
export type ChainType = 'main' | 'test'

export const getBaseURL = (chain: ChainType): string => {
  switch (chain) {
    case 'main':
      return ENDPOINT_MAIN
    case 'test':
      return ENDPOINT_TEST
  }
}

// TODO: add blockchain.info API key support
export const getConfig = (): Config => ({
  api: {
    returnRejectedPromiseOnError: true,
    withCredentials: true,
    timeout:
      parseInt(process.env[ENV_API_TIMEOUT] as string) || DEFAULT_TIMEOUT,
    headers: {
      common: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    },
  },
})

export const logConfig = (config: Config): void => {
  console.log('Adapter configuration:')
  console.log(config)
}
