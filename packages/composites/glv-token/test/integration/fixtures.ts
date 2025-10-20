import nock from 'nock'

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

export const mockMarketInfoApiSuccess = (): nock.Scope =>
  nock(process.env.MARKET_INFO_API!, { encodedQueryParams: true })
    .get('/')
    .reply(200, {
      markets: [
        {
          marketToken: '0x70d95587d40A2caf56bd97485aB3Eec10Bee6336',
          indexToken: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // WETH as index token
          longToken: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
          shortToken: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
          isListed: true,
        },
      ],
    })
    .persist()

export const mockDataEngineEAResponseSuccess = (): nock.Scope =>
  nock(process.env.DATA_ENGINE_ADAPTER_URL!, { encodedQueryParams: true })
    .post('/', (body) => body?.data?.endpoint === 'crypto-v3')
    .reply(200, {
      data: {
        bid: '1999000000000000000', // 1.999
        ask: '2001000000000000000', // 2.001
        price: '2000000000000000000',
        decimals: 18,
      },
      result: null,
      statusCode: 200,
    })
    .persist()

export const mockDataEngineEAResponseFailure = (): nock.Scope =>
  nock(process.env.DATA_ENGINE_ADAPTER_URL!, { encodedQueryParams: true })
    .post('/', (body) => body?.data?.endpoint === 'crypto-v3')
    .reply(500, {})
    .persist()
