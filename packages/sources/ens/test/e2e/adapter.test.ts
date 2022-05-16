import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../../src/adapter'

describe('execute', () => {
  const execute = makeExecute()

  describe('successful calls', () => {
    const requests = [{ name: 'success', testData: { data: { ensName: 'chainlink.eth' } } }]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const response = await execute(req.testData as AdapterRequest, {})
        expect(response.statusCode).toEqual(200)
      })
    })
  })
})
