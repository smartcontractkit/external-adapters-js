import { AdapterContext, AdapterResponse } from '@chainlink/ea-bootstrap'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { runReduceAdapter } from '../../src/utils/reduce'

describe('reduce', () => {
  describe('ethereum-cl-indexer', () => {
    describe('etherFiBalance endpoint', () => {
      const indexerEndpoint = 'etherFiBalance'

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

        const response = await runReduceAdapter(
          'ETHEREUM_CL_INDEXER',
          context,
          input,
          indexerEndpoint,
        )

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

        await expect(() =>
          runReduceAdapter('ETHEREUM_CL_INDEXER', context, input, indexerEndpoint),
        ).rejects.toThrow(`ETHEREUM_CL_INDEXER ripcord is true: ${JSON.stringify(input.data)}`)
      })
    })

    describe('porBalance endpoint', () => {
      const indexerEndpoint = 'porBalance'

      it('should add balances', async () => {
        const jobRunID = '45'
        const balance1 = '1000000000000000000'
        const balance2 = '2000000000000000000'
        const totalBalance = '3000000000000000000'
        const context = makeStub('context', {} as AdapterContext)
        const input = makeStub('input', {
          jobRunID,
          data: {
            result: [
              {
                isValid: true,
                balance: balance1,
                length: undefined,
              },
              {
                isValid: true,
                balance: balance2,
                length: undefined,
              },
            ],
          },
        } as unknown as AdapterResponse)

        const response = await runReduceAdapter(
          'ETHEREUM_CL_INDEXER',
          context,
          input,
          indexerEndpoint,
        )

        expect(response).toEqual({
          jobRunID,
          result: totalBalance,
          statusCode: 200,
          providerStatusCode: 200,
          data: {
            result: totalBalance,
          },
        })
      })

      it('should throw if any result is not valid', async () => {
        const jobRunID = '45'
        const balance = '1000000000000000000'
        const context = makeStub('context', {} as AdapterContext)
        const input = makeStub('input', {
          jobRunID,
          data: {
            result: [
              {
                isValid: true,
                balance: balance,
                length: undefined,
              },
              {
                isValid: false,
                balance: '0',
                length: undefined,
              },
            ],
          },
        } as unknown as AdapterResponse)

        await expect(() =>
          runReduceAdapter('ETHEREUM_CL_INDEXER', context, input, indexerEndpoint),
        ).rejects.toThrow('ETHEREUM_CL_INDEXER endpoint porBalance ripcord is true')
      })
    })
  })
})
