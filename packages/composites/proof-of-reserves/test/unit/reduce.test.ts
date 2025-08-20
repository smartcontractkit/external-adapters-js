import { AdapterContext, AdapterResponse } from '@chainlink/ea-bootstrap'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { runReduceAdapter } from '../../src/utils/reduce'

describe('reduce', () => {
  describe('ethereum-cl-indexer', () => {
    describe('etherFiBalance endpoint', () => {
      it('should get totalBalance', async () => {
        const jobRunID = '45'
        const totalBalance = '123000000000000000000'
        const context = makeStub('context', {} as AdapterContext)
        const input = makeStub('input', {
          jobRunID,
          data: {
            isValid: true,
            totalBalance,
          },
        } as unknown as AdapterResponse)

        const response = await runReduceAdapter('ETHEREUM_CL_INDEXER', context, input)

        expect(response).toEqual({
          jobRunID,
          result: totalBalance,
          statusCode: 200,
          data: {
            result: totalBalance,
            statusCode: 200,
          },
        })
      })

      it('should throw if result is not valid', async () => {
        const jobRunID = '45'
        const totalBalance = '123000000000000000000'
        const context = makeStub('context', {} as AdapterContext)
        const input = makeStub('input', {
          jobRunID,
          data: {
            isValid: false,
            totalBalance,
          },
        } as unknown as AdapterResponse)

        await expect(() => runReduceAdapter('ETHEREUM_CL_INDEXER', context, input)).rejects.toThrow(
          `ETHEREUM_CL_INDEXER ripcord is true: ${JSON.stringify(input.data)}`,
        )
      })
    })
  })
})
