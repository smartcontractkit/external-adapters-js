import nock from 'nock'

export const WETH = '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1'
export const USDC = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'
export const MARKET = '0x70d95587d40A2caf56bd97485aB3Eec10Bee6336'
// Markets the on-chain GLV info can report but the metadata fixtures do not list by
// default. NEW_MARKET is published by /markets on refresh, UNKNOWN_MARKET never is.
export const NEW_MARKET = '0x47c031236e19d024b42f8AE6780E44A573170703'
export const UNKNOWN_MARKET = '0x0Cf1fb4d1FF67A3D8Ca92c9d6643F8F9be8e03E5'

export const mockTokenInfoApiSuccess = (): nock.Scope =>
  nock(process.env.TOKEN_INFO_API!, { encodedQueryParams: true })
    .get('/')
    .reply(200, {
      tokens: [
        {
          symbol: 'WETH',
          address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
          decimals: 18,
          synthetic: null,
        },
        {
          symbol: 'USDC',
          address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
          decimals: 6,
          synthetic: null,
        },
      ],
    })
    .persist()

export const mockMarketInfoApiSuccess = (): nock.Scope => mockMarketInfoApi([MARKET])

// Serves the given market tokens, and reports every request so that tests can assert
// whether the metadata was re-fetched.
export const mockMarketInfoApi = (marketTokens: string[], onRequest?: () => void): nock.Scope =>
  nock(process.env.MARKET_INFO_API!, { encodedQueryParams: true })
    .get('/')
    .reply(200, () => {
      onRequest?.()
      return {
        markets: marketTokens.map((marketToken) => ({
          marketToken,
          indexToken: WETH, // WETH as index token
          longToken: WETH,
          shortToken: USDC,
          isListed: true,
        })),
      }
    })
    .persist()

export const mockDataEngineEAResponseSuccess = () =>
  nock(process.env.DATA_ENGINE_ADAPTER_URL!)
    .post('/', (body) => body?.data?.endpoint === 'crypto-v3')
    .times(10)
    .reply(200, {
      data: {
        bid: '1999000000000000000',
        ask: '2001000000000000000',
        decimals: 18,
      },
      statusCode: 200,
    })

export const mockDataEngineEAResponseFailure = () =>
  nock(process.env.DATA_ENGINE_ADAPTER_URL!)
    .post('/', (body) => body?.data?.endpoint === 'crypto-v3')
    .times(10)
    .reply(500, { statusCode: 500 })
