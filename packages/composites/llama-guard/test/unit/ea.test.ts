import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { config } from '../../src/config'
import { getRawNav } from '../../src/transport/ea'

describe('ea.ts', () => {
  const settings = makeStub('settings', {
    SOURCE_EA_URL: {
      get() {
        return 'mock-url'
      },
    },
  } as unknown as typeof config.settings)

  describe('getRawNav', () => {
    it('should return result', async () => {
      const requester = { request: jest.fn() } as any

      requester.request.mockResolvedValueOnce({ response: { data: { result: 10 } } })
      await expect(getRawNav('ea', '{}', requester, settings)).resolves.toEqual('10')

      const decimals = '1.234456123123'
      requester.request.mockResolvedValueOnce({ response: { data: { result: decimals } } })
      await expect(getRawNav('ea', '{}', requester, settings)).resolves.toEqual(decimals)

      requester.request.mockResolvedValueOnce({ response: { data: { result: ' 11 ' } } })
      await expect(getRawNav('ea', '{}', requester, settings)).resolves.toEqual('11')

      requester.request.mockResolvedValueOnce({ response: { data: { result: ' 0xC ' } } })
      await expect(getRawNav('ea', '{}', requester, settings)).resolves.toEqual('12')

      requester.request.mockResolvedValueOnce({ response: { data: { result: ' 0XD ' } } })
      await expect(getRawNav('ea', '{}', requester, settings)).resolves.toEqual('13')

      const large = '999999999999999999999999999'
      requester.request.mockResolvedValueOnce({ response: { data: { result: large } } })
      await expect(getRawNav('ea', '{}', requester, settings)).resolves.toEqual(large)

      // Limit to 18 decimals
      const largeDecimals = '  9.99999999999999999999999999 '
      requester.request.mockResolvedValueOnce({ response: { data: { result: largeDecimals } } })
      await expect(getRawNav('ea', '{}', requester, settings)).resolves.toEqual(
        '9.999999999999999999',
      )
    })

    it('should throw if empty', async () => {
      const requester = { request: jest.fn() } as any

      requester.request.mockResolvedValueOnce({})
      await expect(() => getRawNav('ea', '{}', requester, settings)).rejects.toThrow(
        'EA request failed: undefined undefined undefined AdapterError',
      )

      requester.request.mockResolvedValueOnce({ response: {} })
      await expect(() => getRawNav('ea', '{}', requester, settings)).rejects.toThrow(
        'EA request failed: undefined undefined undefined AdapterError',
      )

      requester.request.mockResolvedValueOnce({
        response: { data: {}, status: 404, statusText: 'fail' },
      })
      await expect(() => getRawNav('ea', '{}', requester, settings)).rejects.toThrow(
        'EA request failed: {} 404 fail AdapterError',
      )

      requester.request.mockResolvedValueOnce({
        response: { data: { result: null }, status: 200, statusText: 'ok' },
      })
      await expect(() => getRawNav('ea', '{}', requester, settings)).rejects.toThrow(
        'EA request failed: {"result":null} 200 ok AdapterError',
      )

      requester.request.mockResolvedValueOnce({
        response: { data: { result: 0 }, status: 200, statusText: 'ok' },
      })
      await expect(() => getRawNav('ea', '{}', requester, settings)).rejects.toThrow(
        'EA request failed: {"result":0} 200 ok AdapterError',
      )
    })

    it('should throw if not valid number', async () => {
      const requester = { request: jest.fn() } as any

      requester.request.mockResolvedValueOnce({ response: { data: { result: 'abc' } } })
      await expect(() => getRawNav('ea', '{}', requester, settings)).rejects.toThrow(
        'EA response is not a number: abc',
      )
    })
  })
})
