import { getEAUrl, getRawNav } from '../../src/transport/ea'

const originalEnv = { ...process.env }

const restoreEnv = () => {
  for (const key of Object.keys(process.env)) {
    if (key in originalEnv) {
      process.env[key] = originalEnv[key]
    } else {
      delete process.env[key]
    }
  }
}

describe('ea.ts', () => {
  beforeEach(() => {
    restoreEnv()
  })

  afterAll(() => {
    restoreEnv()
  })

  describe('getEAUrl', () => {
    it('should return url', () => {
      process.env.MY_NAME_EA_URL = 'mock-url'

      expect(getEAUrl('my-name')).toEqual(process.env.MY_NAME_EA_URL)
      expect(getEAUrl('My_name')).toEqual(process.env.MY_NAME_EA_URL)
      expect(getEAUrl('MY_NAME')).toEqual(process.env.MY_NAME_EA_URL)
    })

    it('should replace all -', () => {
      process.env.MY_NAME_EXTRA_EA_URL = 'mock-url-extra'
      expect(getEAUrl('my-name-extra')).toEqual(process.env.MY_NAME_EXTRA_EA_URL)
    })

    it('should throw error when missing', () => {
      expect(() => getEAUrl('my-name')).toThrow("Missing 'MY_NAME' environment variable.")
    })
  })

  describe('getRawNav', () => {
    it('should return result', async () => {
      process.env.EA_EA_URL = 'mock-url'
      const requester = { request: jest.fn() } as any

      requester.request.mockResolvedValueOnce({ response: { data: { result: 10 } } })
      await expect(getRawNav('ea', '{}', requester)).resolves.toEqual('10')

      const decimals = '1.234456123123'
      requester.request.mockResolvedValueOnce({ response: { data: { result: decimals } } })
      await expect(getRawNav('ea', '{}', requester)).resolves.toEqual(decimals)

      requester.request.mockResolvedValueOnce({ response: { data: { result: ' 11 ' } } })
      await expect(getRawNav('ea', '{}', requester)).resolves.toEqual('11')

      requester.request.mockResolvedValueOnce({ response: { data: { result: ' 0xC ' } } })
      await expect(getRawNav('ea', '{}', requester)).resolves.toEqual('12')

      requester.request.mockResolvedValueOnce({ response: { data: { result: ' 0XD ' } } })
      await expect(getRawNav('ea', '{}', requester)).resolves.toEqual('13')

      const large = '999999999999999999999999999'
      requester.request.mockResolvedValueOnce({ response: { data: { result: large } } })
      await expect(getRawNav('ea', '{}', requester)).resolves.toEqual(large)

      // Limit to 18 decimals
      const largeDecimals = '  9.99999999999999999999999999 '
      requester.request.mockResolvedValueOnce({ response: { data: { result: largeDecimals } } })
      await expect(getRawNav('ea', '{}', requester)).resolves.toEqual('9.999999999999999999')
    })

    it('should throw if empty', async () => {
      process.env.EA_EA_URL = 'mock-url'
      const requester = { request: jest.fn() } as any

      requester.request.mockResolvedValueOnce({})
      await expect(() => getRawNav('ea', '{}', requester)).rejects.toThrow(
        'EA request failed: undefined',
      )

      requester.request.mockResolvedValueOnce({ response: {} })
      await expect(() => getRawNav('ea', '{}', requester)).rejects.toThrow('EA request failed: {}')

      requester.request.mockResolvedValueOnce({ response: { data: {} } })
      await expect(() => getRawNav('ea', '{}', requester)).rejects.toThrow(
        'EA request failed: {"data":{}}',
      )

      requester.request.mockResolvedValueOnce({ response: { data: { result: null } } })
      await expect(() => getRawNav('ea', '{}', requester)).rejects.toThrow(
        'EA request failed: {"data":{"result":null}}',
      )

      requester.request.mockResolvedValueOnce({ response: { data: { result: 0 } } })
      await expect(() => getRawNav('ea', '{}', requester)).rejects.toThrow(
        'EA request failed: {"data":{"result":0}}',
      )
    })

    it('should throw if not valid number', async () => {
      process.env.EA_EA_URL = 'mock-url'
      const requester = { request: jest.fn() } as any

      requester.request.mockResolvedValueOnce({ response: { data: { result: 'abc' } } })
      await expect(() => getRawNav('ea', '{}', requester)).rejects.toThrow(
        'EA response is not a number: abc',
      )
    })
  })
})
