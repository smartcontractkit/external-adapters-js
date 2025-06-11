import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes } from '../../src/endpoint/mintable'
import { getReserve } from '../../src/transport/reserve'

LoggerFactoryProvider.set()

const token = 'test-token'
const reserves = 'Bitgo'
const endpointName = 'reserve'
const transportName = 'secure-mint'

const config = {
  BITGO_RESERVES_EA_URL: 'https://bitgo.example.com',
} as unknown as BaseEndpointTypes['Settings']

const requester = makeStub('requester', {
  request: jest.fn(),
})

describe('getReserve', () => {
  it('returns parsed reserveAmount and timestamp', async () => {
    requester.request.mockResolvedValueOnce(
      makeStub('reservesResponse', {
        response: {
          data: {
            result: '123.456',
            timestamps: {
              providerDataReceivedUnixMs: 1710000000000,
            },
          },
        },
      }),
    )

    const result = await getReserve(
      token,
      reserves,
      requester as unknown as Requester,
      config,
      endpointName,
      transportName,
    )

    expect(requester.request).toHaveBeenNthCalledWith(1, expect.any(String), {
      method: 'post',
      baseURL: config.BITGO_RESERVES_EA_URL,
      data: {
        data: {
          client: token,
        },
      },
    })

    expect(result.reserveAmount).toEqual(123456000000000000000n)
    expect(result.timestamp).toBe(1710000000000)
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
      await getReserve(
        token,
        reserves,
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
      await getReserve(
        token,
        reserves,
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
