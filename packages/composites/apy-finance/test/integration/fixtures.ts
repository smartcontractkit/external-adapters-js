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
      params: [{ to: '0x7ec81b7035e91f8435bdeb2787dcbd51116ad303', data: '0xfcbf6ef8' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result: '0x00000000000000000000000074a07a137e347590b7d6fa63b70c2c331af94a8b',
      }),
      [],
    )
    .post('/', {
      method: 'eth_call',
      params: [{ to: '0x74a07a137e347590b7d6fa63b70c2c331af94a8b', data: '0xd8de0947' }, 'latest'],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request: AdapterRequest) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result:
          '0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000011893e362eeaefe364facfb30daa986746b65eb67000000000000000000000000',
      }),
      [],
    )
    .post('/', {
      method: 'eth_call',
      params: [
        {
          to: '0x74a07a137e347590b7d6fa63b70c2c331af94a8b',
          data: '0xd87e053c1893e362eeaefe364facfb30daa986746b65eb67060000000000000000000000',
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
        result:
          '0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000044652415800000000000000000000000000000000000000000000000000000000',
      }),
      [],
    )
    .post('/', {
      method: 'eth_call',
      params: [
        {
          to: '0x74a07a137e347590b7d6fa63b70c2c331af94a8b',
          data: '0xd87e053c1893e362eeaefe364facfb30daa986746b65eb67000000000000000000000000',
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
        result:
          '0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000034441490000000000000000000000000000000000000000000000000000000000',
      }),
      [],
    )
    .post('/', {
      method: 'eth_call',
      params: [
        {
          to: '0x74a07a137e347590b7d6fa63b70c2c331af94a8b',
          data: '0x6c7f15421893e362eeaefe364facfb30daa986746b65eb67000000000000000000000000',
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
        result: '0x0000000000000000000000000000000000000000000000000000000000000000',
      }),
      [],
    )
    .post('/', {
      method: 'eth_call',
      params: [
        {
          to: '0x74a07a137e347590b7d6fa63b70c2c331af94a8b',
          data: '0xdab09d9f1893e362eeaefe364facfb30daa986746b65eb67000000000000000000000000',
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
        result: '0x0000000000000000000000000000000000000000000000000000000000000012',
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
