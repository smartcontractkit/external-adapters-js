import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes } from '../../src/endpoint/mintable'
import { getSupply } from '../../src/transport/supply'

LoggerFactoryProvider.set()

const token = 'test-token'
const endpointName = 'reserve'
const transportName = 'secure-mint'

const config = {
  SECURE_MINT_INDEXER_URL: 'https://indexer.example.com',
} as unknown as BaseEndpointTypes['Settings']

const requester = makeStub('requester', {
  request: jest.fn(),
})

beforeEach(() => {
  requester.request.mockReset()
})

describe('getReserve', () => {
  it('returns parsed reserveAmount and timestamp', async () => {
    const response = {
      supply: 100,
      premint: 200,
      chains: {
        '1': {
          latest_block: 300,
          response_block: 400,
          request_block: 500,
          mintable: '600',
          token_supply: '700',
          token_native_mint: '800',
          token_ccip_mint: '900',
          token_ccip_burn: '1000',
          token_pre_mint: '1100',
          aggregate_pre_mint: false,
        },
        '56': {
          latest_block: 3000,
          response_block: 4000,
          request_block: 5000,
          mintable: '6000',
          token_supply: '7000',
          token_native_mint: '8000',
          token_ccip_mint: '9000',
          token_ccip_burn: '10000',
          token_pre_mint: '11000',
          aggregate_pre_mint: true,
        },
      },
    }
    requester.request.mockResolvedValueOnce(
      makeStub('reservesResponse', {
        response: {
          data: response,
        },
      }),
    )

    const result = await getSupply(
      token,
      ['1', '56'],
      [100, 200],
      requester as unknown as Requester,
      config,
      endpointName,
      transportName,
    )

    expect(requester.request).toHaveBeenNthCalledWith(1, expect.any(String), {
      method: 'post',
      baseURL: config.SECURE_MINT_INDEXER_URL,
      url: 'data',
      data: {
        token,
        chains: {
          '1': 100,
          '56': 200,
        },
      },
    })

    expect(result).toStrictEqual(response)
  })

  it('returns parsed error_message', async () => {
    const response = {
      chains: {
        '1': {
          latest_block: 300,
          error_message: 'error',
        },
      },
    }
    requester.request.mockResolvedValueOnce(
      makeStub('reservesResponse', {
        response: {
          data: response,
        },
      }),
    )

    const result = await getSupply(
      token,
      ['1'],
      [100],
      requester as unknown as Requester,
      config,
      endpointName,
      transportName,
    )

    expect(requester.request).toHaveBeenNthCalledWith(1, expect.any(String), {
      method: 'post',
      baseURL: config.SECURE_MINT_INDEXER_URL,
      url: 'data',
      data: {
        token,
        chains: {
          '1': 100,
        },
      },
    })

    expect(result).toStrictEqual(response)
  })

  it('throws exception - use errorResponse', async () => {
    requester.request.mockRejectedValue(
      new AdapterError({
        message: 'message',
        errorResponse: {
          error: 'error',
        },
        name: 'name',
      }),
    )

    try {
      await getSupply(
        token,
        ['1', '56'],
        [100, 200],
        requester as unknown as Requester,
        config,
        endpointName,
        transportName,
      )
      fail('Expected getReserve to throw')
    } catch (e) {
      expect((e as Error).message).toBe('message {"error":"error"}')
    }
  })

  it('throws exception - default to name', async () => {
    requester.request.mockRejectedValue(
      new AdapterError({
        message: 'message',
        name: 'name',
      }),
    )

    try {
      await getSupply(
        token,
        ['1', '56'],
        [100, 200],
        requester as unknown as Requester,
        config,
        endpointName,
        transportName,
      )
      fail('Expected getReserve to throw')
    } catch (e) {
      expect((e as Error).message).toBe('message name')
    }
  })
})
