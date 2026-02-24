import nock from 'nock'

type JsonRpcPayload = {
  id: number
  method: string
  params: Array<{ to: string; data: string }>
  jsonrpc: '2.0'
}

// Chainlink price feed function signatures
const DECIMALS_SIG_HASH = '0x313ce567'
const LATEST_ANSWER_SIG_HASH = '0x50d25bcd'

// Price feed addresses (from config defaults)
export const BTC_USD_FEED_ADDRESS = '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c'
export const ETH_USD_FEED_ADDRESS = '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419'
export const SOL_USD_FEED_ADDRESS = '0x4ffC43a60e009B551865A93d232E33Fce9f01507'
export const USDC_USD_FEED_ADDRESS = '0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6'
export const USDT_USD_FEED_ADDRESS = '0x3E7d1eAB13ad0104d2750B8863b489D65364e32D'
export const USYC_USD_FEED_ADDRESS = '0x1111111111111111111111111111111111111111'
export const OUSG_USD_FEED_ADDRESS = '0x2222222222222222222222222222222222222222'
export const JTRSY_USD_FEED_ADDRESS = '0x3333333333333333333333333333333333333333'

// Mock price data: { address: { decimals: number, latestAnswer: bigint } }
const PRICE_FEEDS: Record<string, { decimals: number; latestAnswer: bigint }> = {
  [BTC_USD_FEED_ADDRESS.toLowerCase()]: { decimals: 8, latestAnswer: 10000000000000n }, // $100,000
  [ETH_USD_FEED_ADDRESS.toLowerCase()]: { decimals: 8, latestAnswer: 350000000000n }, // $3,500
  [SOL_USD_FEED_ADDRESS.toLowerCase()]: { decimals: 8, latestAnswer: 15000000000n }, // $150
  [USDC_USD_FEED_ADDRESS.toLowerCase()]: { decimals: 8, latestAnswer: 100000000n }, // $1
  [USDT_USD_FEED_ADDRESS.toLowerCase()]: { decimals: 8, latestAnswer: 100000000n }, // $1
  [USYC_USD_FEED_ADDRESS.toLowerCase()]: { decimals: 8, latestAnswer: 110000000n }, // $1.10
  [OUSG_USD_FEED_ADDRESS.toLowerCase()]: { decimals: 8, latestAnswer: 105000000n }, // $1.05
  [JTRSY_USD_FEED_ADDRESS.toLowerCase()]: { decimals: 8, latestAnswer: 102000000n }, // $1.02
}

const bigintToEthRpcResult = (value: bigint): string => {
  return '0x' + value.toString(16).padStart(64, '0')
}

export const mockEthereumRpc = (): nock.Scope =>
  nock('http://localhost:8545', {})
    .post('/', (body: any) => Array.isArray(body))
    .reply(
      200,
      (_uri, requestBody: JsonRpcPayload[]) => {
        return requestBody.map((request: JsonRpcPayload) => {
          if (request.method === 'eth_chainId') {
            return {
              jsonrpc: '2.0',
              id: request.id,
              result: bigintToEthRpcResult(1n),
            }
          } else if (request.method === 'eth_call') {
            const [{ to, data }] = request.params
            const feedAddress = to.toLowerCase()
            const feed = PRICE_FEEDS[feedAddress]

            if (data === DECIMALS_SIG_HASH && feed) {
              return {
                jsonrpc: '2.0',
                id: request.id,
                result: bigintToEthRpcResult(BigInt(feed.decimals)),
              }
            } else if (data === LATEST_ANSWER_SIG_HASH && feed) {
              return {
                jsonrpc: '2.0',
                id: request.id,
                result: bigintToEthRpcResult(feed.latestAnswer),
              }
            }
          }
          console.log('Unmocked Ethereum RPC request:', JSON.stringify(request, null, 2))
          return {
            jsonrpc: '2.0',
            id: request.id,
            result: '',
          }
        })
      },
      ['Content-Type', 'application/json', 'Connection', 'close'],
    )
    .persist()

// Mock Copper API responses
export const mockCopperWalletsSuccess = (): nock.Scope =>
  nock('https://api.copper.co/platform', {
    encodedQueryParams: true,
  })
    .persist()
    .get('/wallets')
    .reply(
      200,
      {
        wallets: [
          {
            walletId: 'wallet-1',
            portfolioId: 'portfolio-1',
            portfolioType: 'custody',
            currency: 'BTC',
            mainCurrency: 'BTC',
            balance: '10.5',
            stakeBalance: '0',
            totalBalance: '10.5',
            available: '10.5',
            locked: '0',
            reserve: '0',
            updatedAt: '1704067200000',
            createdAt: '1704067200000',
          },
          {
            walletId: 'wallet-2',
            portfolioId: 'portfolio-1',
            portfolioType: 'custody',
            currency: 'ETH',
            mainCurrency: 'ETH',
            balance: '100',
            stakeBalance: '50',
            totalBalance: '150',
            available: '100',
            locked: '0',
            reserve: '0',
            updatedAt: '1704067200000',
            createdAt: '1704067200000',
          },
          {
            walletId: 'wallet-3',
            portfolioId: 'portfolio-1',
            portfolioType: 'custody',
            currency: 'USDC',
            mainCurrency: 'USDC',
            balance: '100000',
            stakeBalance: '0',
            totalBalance: '100000',
            available: '100000',
            locked: '0',
            reserve: '0',
            updatedAt: '1704067200000',
            createdAt: '1704067200000',
          },
          {
            walletId: 'wallet-4',
            portfolioId: 'portfolio-1',
            portfolioType: 'custody',
            currency: 'SOL',
            mainCurrency: 'SOL',
            balance: '200',
            stakeBalance: '100',
            totalBalance: '300',
            available: '200',
            locked: '0',
            reserve: '0',
            updatedAt: '1704153600000',
            createdAt: '1704067200000',
          },
        ],
      },
      ['Content-Type', 'application/json', 'Connection', 'close'],
    )

export const mockCopperWalletsWithUstb = (): nock.Scope =>
  nock('https://api.copper.co/platform', {
    encodedQueryParams: true,
  })
    .persist()
    .get('/wallets')
    .reply(
      200,
      {
        wallets: [
          {
            walletId: 'wallet-1',
            portfolioId: 'portfolio-1',
            portfolioType: 'custody',
            currency: 'BTC',
            mainCurrency: 'BTC',
            balance: '1',
            stakeBalance: '0',
            totalBalance: '1',
            available: '1',
            locked: '0',
            reserve: '0',
            updatedAt: '1704067200000',
            createdAt: '1704067200000',
          },
          {
            walletId: 'wallet-2',
            portfolioId: 'portfolio-1',
            portfolioType: 'custody',
            currency: 'USTB',
            mainCurrency: 'USTB',
            balance: '50000',
            stakeBalance: '0',
            totalBalance: '50000',
            available: '50000',
            locked: '0',
            reserve: '0',
            updatedAt: '1704067200000',
            createdAt: '1704067200000',
          },
        ],
      },
      ['Content-Type', 'application/json', 'Connection', 'close'],
    )

export const mockCopperWalletsAllAssets = (): nock.Scope =>
  nock('https://api.copper.co/platform', {
    encodedQueryParams: true,
  })
    .persist()
    .get('/wallets')
    .reply(
      200,
      {
        wallets: [
          {
            walletId: 'wallet-btc',
            portfolioId: 'portfolio-1',
            portfolioType: 'custody',
            currency: 'BTC',
            mainCurrency: 'BTC',
            balance: '1',
            stakeBalance: '0',
            totalBalance: '1',
            available: '1',
            locked: '0',
            reserve: '0',
            updatedAt: '1704067200000',
            createdAt: '1704067200000',
          },
          {
            walletId: 'wallet-eth',
            portfolioId: 'portfolio-1',
            portfolioType: 'custody',
            currency: 'ETH',
            mainCurrency: 'ETH',
            balance: '10',
            stakeBalance: '5',
            totalBalance: '15',
            available: '10',
            locked: '0',
            reserve: '0',
            updatedAt: '1704067200000',
            createdAt: '1704067200000',
          },
          {
            walletId: 'wallet-sol',
            portfolioId: 'portfolio-1',
            portfolioType: 'custody',
            currency: 'SOL',
            mainCurrency: 'SOL',
            balance: '100',
            stakeBalance: '50',
            totalBalance: '150',
            available: '100',
            locked: '0',
            reserve: '0',
            updatedAt: '1704067200000',
            createdAt: '1704067200000',
          },
          {
            walletId: 'wallet-usdc',
            portfolioId: 'portfolio-1',
            portfolioType: 'custody',
            currency: 'USDC',
            mainCurrency: 'USDC',
            balance: '10000',
            stakeBalance: '0',
            totalBalance: '10000',
            available: '10000',
            locked: '0',
            reserve: '0',
            updatedAt: '1704067200000',
            createdAt: '1704067200000',
          },
          {
            walletId: 'wallet-usdt',
            portfolioId: 'portfolio-1',
            portfolioType: 'custody',
            currency: 'USDT',
            mainCurrency: 'USDT',
            balance: '5000',
            stakeBalance: '0',
            totalBalance: '5000',
            available: '5000',
            locked: '0',
            reserve: '0',
            updatedAt: '1704067200000',
            createdAt: '1704067200000',
          },
          {
            walletId: 'wallet-usyc',
            portfolioId: 'portfolio-1',
            portfolioType: 'custody',
            currency: 'USYC',
            mainCurrency: 'USYC',
            balance: '1000',
            stakeBalance: '0',
            totalBalance: '1000',
            available: '1000',
            locked: '0',
            reserve: '0',
            updatedAt: '1704067200000',
            createdAt: '1704067200000',
          },
          {
            walletId: 'wallet-ousg',
            portfolioId: 'portfolio-1',
            portfolioType: 'custody',
            currency: 'OUSG',
            mainCurrency: 'OUSG',
            balance: '2000',
            stakeBalance: '0',
            totalBalance: '2000',
            available: '2000',
            locked: '0',
            reserve: '0',
            updatedAt: '1704067200000',
            createdAt: '1704067200000',
          },
          {
            walletId: 'wallet-jtrsy',
            portfolioId: 'portfolio-1',
            portfolioType: 'custody',
            currency: 'JTRSY',
            mainCurrency: 'JTRSY',
            balance: '3000',
            stakeBalance: '0',
            totalBalance: '3000',
            available: '3000',
            locked: '0',
            reserve: '0',
            updatedAt: '1704067200000',
            createdAt: '1704067200000',
          },
          {
            walletId: 'wallet-ustb',
            portfolioId: 'portfolio-1',
            portfolioType: 'custody',
            currency: 'USTB',
            mainCurrency: 'USTB',
            balance: '4000',
            stakeBalance: '0',
            totalBalance: '4000',
            available: '4000',
            locked: '0',
            reserve: '0',
            updatedAt: '1704067200000',
            createdAt: '1704067200000',
          },
        ],
      },
      ['Content-Type', 'application/json', 'Connection', 'close'],
    )

export const mockCopperWalletsEmpty = (): nock.Scope =>
  nock('https://api.copper.co/platform', {
    encodedQueryParams: true,
  })
    .persist()
    .get('/wallets')
    .reply(
      200,
      {
        wallets: [],
      },
      ['Content-Type', 'application/json', 'Connection', 'close'],
    )

export const mockCopperWalletsUnsupportedAssets = (): nock.Scope =>
  nock('https://api.copper.co/platform', {
    encodedQueryParams: true,
  })
    .persist()
    .get('/wallets')
    .reply(
      200,
      {
        wallets: [
          {
            walletId: 'wallet-1',
            portfolioId: 'portfolio-1',
            portfolioType: 'custody',
            currency: 'DOGE',
            mainCurrency: 'DOGE',
            balance: '1000000',
            stakeBalance: '0',
            totalBalance: '1000000',
            available: '1000000',
            locked: '0',
            reserve: '0',
            updatedAt: '1704067200000',
            createdAt: '1704067200000',
          },
          {
            walletId: 'wallet-2',
            portfolioId: 'portfolio-1',
            portfolioType: 'custody',
            currency: 'XRP',
            mainCurrency: 'XRP',
            balance: '500000',
            stakeBalance: '0',
            totalBalance: '500000',
            available: '500000',
            locked: '0',
            reserve: '0',
            updatedAt: '1704067200000',
            createdAt: '1704067200000',
          },
        ],
      },
      ['Content-Type', 'application/json', 'Connection', 'close'],
    )

export const mockCopperWalletsApiError = (): nock.Scope =>
  nock('https://api.copper.co/platform', {
    encodedQueryParams: true,
  })
    .persist()
    .get('/wallets')
    .reply(500, { error: 'Internal Server Error' })

export const mockCopperWalletsInvalidResponse = (): nock.Scope =>
  nock('https://api.copper.co/platform', {
    encodedQueryParams: true,
  })
    .persist()
    .get('/wallets')
    .reply(200, { data: 'invalid' })

export const mockCopperWalletsNullResponse = (): nock.Scope =>
  nock('https://api.copper.co/platform', {
    encodedQueryParams: true,
  })
    .persist()
    .get('/wallets')
    .reply(200, null)

// Mock Superstate API responses
export const mockSuperstateNavSuccess = (): nock.Scope =>
  nock('https://api.superstate.co', {
    encodedQueryParams: true,
  })
    .persist()
    .get('/funds/1/nav-daily')
    .query(true)
    .reply(
      200,
      [
        { net_asset_value: '1.0234', date: '2024-01-01' },
        { net_asset_value: '1.0230', date: '2023-12-31' },
        { net_asset_value: '1.0225', date: '2023-12-30' },
      ],
      ['Content-Type', 'application/json', 'Connection', 'close'],
    )

export const mockSuperstateNavEmpty = (): nock.Scope =>
  nock('https://api.superstate.co', {
    encodedQueryParams: true,
  })
    .persist()
    .get('/funds/1/nav-daily')
    .query(true)
    .reply(200, [], ['Content-Type', 'application/json', 'Connection', 'close'])

export const mockSuperstateNavError = (): nock.Scope =>
  nock('https://api.superstate.co', {
    encodedQueryParams: true,
  })
    .persist()
    .get('/funds/1/nav-daily')
    .query(true)
    .reply(500, { error: 'Internal Server Error' })
