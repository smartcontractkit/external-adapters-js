import { separateBatches } from '../../src/lib/ws/utils'

describe('WebSockets', () => {
  describe('Separate batches', () => {
    it('should correctly separate a batched request into individual requests', async () => {
      const request = {
        id: '1',
        data: {
          base: 'BTC',
          quote: ['USD', 'EUR'],
        },
      }
      const splitRequests = []
      await separateBatches(request, async (res) => {
        splitRequests.push(res)
      })
      expect(splitRequests.length).toEqual(2)
      const [firstRequest, secondRequest] = splitRequests
      expect(firstRequest.data.base).toBe('BTC')
      expect(secondRequest.data.base).toBe('BTC')
      expect(firstRequest.data.quote).toBe('USD')
      expect(secondRequest.data.quote).toBe('EUR')
    })
  })
})
