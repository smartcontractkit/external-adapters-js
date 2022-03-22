import { makeExecute } from '../../src/adapter'
import { mockCryptoSingleResponseSuccess } from './fixtures'
import nock from 'nock'

afterAll((done) => {
  nock.restore()
  nock.cleanAll()
  nock.enableNetConnect()
  done()
})

describe('crypto-single endpoint', () => {
  const execute = makeExecute()
  mockCryptoSingleResponseSuccess()

  describe('Successful request without override', () => {
    it('Should be successful', async () => {
      const data = {
        id: '1',
        data: {
          endpoint: 'crypto-single',
          to: 'USD',
          from: 'AAAA',
        },
      }
      const response = await execute(data, {})
      expect(response.result).toBe(200.0)
    })
  })

  describe('Successful request with override', () => {
    it('Should be successful', async () => {
      const data1 = {
        id: '1',
        data: {
          endpoint: 'crypto-single',
          to: 'USD',
          from: 'AMPL',
          overrides: {
            coinpaprika: {
              AMPL: 'eth-ethereum',
            },
          },
        },
      }
      const response = await execute(data1, {})
      expect(response.result).toBe(3949.2425813062)
    })
  })

  describe('Successful request with warning about duplicate ticker symbol', () => {
    mockCryptoSingleResponseSuccess()
    it('Should be successful', async () => {
      const data2 = {
        id: '1',
        data: {
          endpoint: 'crypto-single',
          to: 'USD',
          from: 'BBBB',
        },
      }
      const response = await execute(data2, {})
      expect(response.result).toBe(300.0)
    })
  })
})
