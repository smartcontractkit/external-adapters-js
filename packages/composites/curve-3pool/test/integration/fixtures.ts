import { AdapterRequest } from '@chainlink/ea-bootstrap'
import nock from 'nock'

export function mockEthereumCalls(): nock.Scope {
  return nock('https://geth-main.eth.devnet.tools:443', { encodedQueryParams: true })
    .persist()
    .post('/', {
      method: 'eth_chainId',
      params: [],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest) => ({ jsonrpc: '2.0', id: request['id'], result: '0x1' }),
      [],
    )
    .post('/', {
      method: 'eth_call',
      params: [{ to: '0x6c3f90f043a72fa612cbac8115ee7e52bde6e490', data: '0x18160ddd' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x0000000000000000000000000000000000000000054051140f7c4b26349ad44b',
      }),
      [],
    )
    .post('/', {
      method: 'eth_call',
      params: [
        {
          to: '0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7',
          data: '0x4903b0d10000000000000000000000000000000000000000000000000000000000000000',
        },
        'latest',
      ],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x0000000000000000000000000000000000000000011a882458c863bb8aa6e218',
      }),
      [],
    )
    .post('/', {
      method: 'eth_call',
      params: [
        {
          to: '0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7',
          data: '0x4903b0d10000000000000000000000000000000000000000000000000000000000000001',
        },
        'latest',
      ],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x000000000000000000000000000000000000000000000000000132a728e0d17e',
      }),
      [],
    )
    .post('/', {
      method: 'eth_call',
      params: [
        {
          to: '0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7',
          data: '0x4903b0d10000000000000000000000000000000000000000000000000000000000000002',
        },
        'latest',
      ],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x00000000000000000000000000000000000000000000000000037ca0681402ee',
      }),
      [],
    )
}

export const mockTiingoResponse = (): nock.Scope =>
  nock('http://localhost:3000')
    .post('/', { id: '1', data: { base: 'USDC', quote: 'USD', endpoint: 'price' } })
    .reply(200, {
      jobRunID: '1',
      providerStatusCode: 200,
      data: {
        sources: [],
        payload: {
          WETH: {
            quote: {
              USD: {
                price: '1800',
              },
            },
          },
          LINK: {
            quote: {
              USD: {
                price: '2000',
              },
            },
          },
        },
        result: 2000,
      },
      result: 2000,
      statusCode: 200,
    })

nock('http://localhost:3000')
  .post('/', { id: '1', data: { base: 'DAI', quote: 'USD', endpoint: 'crypto' } })
  .reply(200, {
    jobRunID: '1',
    providerStatusCode: 200,
    data: {
      sources: [],
      payload: {
        DAI: {
          quote: {
            USD: {
              price: '1.0',
            },
          },
        },
      },
      result: 1.0,
    },
    result: 1.0,
    statusCode: 200,
  })

nock('http://localhost:3000')
  .post('/', { id: '1', data: { base: 'USDC', quote: 'USD', endpoint: 'crypto' } })
  .reply(200, {
    jobRunID: '1',
    providerStatusCode: 200,
    data: {
      sources: [],
      payload: {
        USDC: {
          quote: {
            USD: {
              price: '1.0',
            },
          },
        },
      },
      result: 1.0,
    },
    result: 1.0,
    statusCode: 200,
  })

nock('http://localhost:3000')
  .post('/', { id: '1', data: { base: 'USDT', quote: 'USD', endpoint: 'crypto' } })
  .reply(200, {
    jobRunID: '1',
    providerStatusCode: 200,
    data: {
      sources: [],
      payload: {
        USDT: {
          quote: {
            USD: {
              price: '1.0',
            },
          },
        },
      },
      result: 1.0,
    },
    result: 1.0,
    statusCode: 200,
  })

nock('http://localhost:3000')
  .post('/', { id: '1', data: { base: 'DAI', quote: 'USD', endpoint: 'crypto' } })
  .reply(200, {
    jobRunID: '1',
    providerStatusCode: 200,
    data: {
      sources: [],
      payload: {
        DAI: {
          quote: {
            USD: {
              price: '1.0',
            },
          },
        },
      },
      result: 1.01,
    },
    result: 1.01,
    statusCode: 200,
  })

nock('http://localhost:3000')
  .post('/', { id: '1', data: { base: 'USDC', quote: 'USD', endpoint: 'crypto' } })
  .reply(200, {
    jobRunID: '1',
    providerStatusCode: 200,
    data: {
      sources: [],
      payload: {
        USDC: {
          quote: {
            USD: {
              price: '1.0',
            },
          },
        },
      },
      result: 0.998,
    },
    result: 0.998,
    statusCode: 200,
  })

nock('http://localhost:3000')
  .post('/', { id: '1', data: { base: 'USDT', quote: 'USD', endpoint: 'crypto' } })
  .reply(200, {
    jobRunID: '1',
    providerStatusCode: 200,
    data: {
      sources: [],
      payload: {
        USDT: {
          quote: {
            USD: {
              price: '1.0',
            },
          },
        },
      },
      result: 1.002,
    },
    result: 1.002,
    statusCode: 200,
  })
