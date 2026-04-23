import { createAdapterResponseFromMessage } from '../../src/transport/depth-shared'

describe('depth-shared', () => {
  const symbol = 'TEST'
  const region = 'hk'
  const askPrice = 100
  const bidPrice = 90
  const midPrice = 95
  const askVolume = 10
  const bidVolume = 20

  describe('createAdapterResponseFromMessage', () => {
    it('should create a valid adapter response from a message', () => {
      const message = {
        code: 0,
        msg: null,
        data: {
          s: symbol,
          r: region,
          a: [
            {
              po: 1,
              p: askPrice,
              v: askVolume,
              o: 1,
            },
          ],
          b: [
            {
              po: 1,
              p: bidPrice,
              v: bidVolume,
              o: 2,
            },
          ],
        },
      }

      const expectedResponse = {
        params: { base: symbol, region },
        response: {
          result: midPrice,
          data: {
            symbol,
            askPrice,
            bidPrice,
            midPrice,
            askVolume,
            bidVolume,
          },
        },
      }

      const response = createAdapterResponseFromMessage(message)

      expect(response).toEqual([expectedResponse])
    })

    it('should ignore additional bids and asks', () => {
      const message = {
        code: 0,
        msg: null,
        data: {
          s: symbol,
          r: region,
          a: [
            {
              po: 1,
              p: askPrice,
              v: askVolume,
              o: 1,
            },
            {
              po: 2,
              p: askPrice + 1,
              v: askVolume + 1,
              o: 3,
            },
          ],
          b: [
            {
              po: 1,
              p: bidPrice,
              v: bidVolume,
              o: 2,
            },
            {
              po: 2,
              p: bidPrice - 1,
              v: bidVolume + 1,
              o: 4,
            },
          ],
        },
      }

      const expectedResponse = {
        params: { base: symbol, region },
        response: {
          result: midPrice,
          data: {
            symbol,
            askPrice,
            bidPrice,
            midPrice,
            askVolume,
            bidVolume,
          },
        },
      }

      const response = createAdapterResponseFromMessage(message)

      expect(response).toEqual([expectedResponse])
    })

    it('should throw if there are no bids', () => {
      const message = {
        code: 0,
        msg: null,
        data: {
          s: symbol,
          r: region,
          a: [
            {
              po: 1,
              p: askPrice,
              v: askVolume,
              o: 1,
            },
          ],
          b: [],
        },
      }

      expect(() => createAdapterResponseFromMessage(message)).toThrow('Ask or bid data is missing')
    })

    it('should throw if there are no asks', () => {
      const message = {
        code: 0,
        msg: null,
        data: {
          s: symbol,
          r: region,
          a: [],
          b: [
            {
              po: 1,
              p: bidPrice,
              v: bidVolume,
              o: 2,
            },
          ],
        },
      }

      expect(() => createAdapterResponseFromMessage(message)).toThrow('Ask or bid data is missing')
    })

    it('should throw if there are no bids and no asks', () => {
      const message = {
        code: 0,
        msg: null,
        data: {
          s: symbol,
          r: region,
          a: [],
          b: [],
        },
      }

      expect(() => createAdapterResponseFromMessage(message)).toThrow('Ask or bid data is missing')
    })
  })
})
