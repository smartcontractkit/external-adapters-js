import { sleep } from '@chainlink/external-adapter-framework/util'
import { ethers } from 'ethers'
import { DefaultAddressManager } from '../../src/transport/addressManager'

// test
const DEFAULT_EXPECTED_ADDRESSES = [
  '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
  '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc',
  '0x90f79bf6eb2c4f870365e785982e1f101e93b906',
  '0x15d34aaf54267db7d7c367839aaf71a00a2c6a65',
  '0x9965507d1a55bcc2695c58ba16fb37d819b0a4dc',
  '0x976ea74026e726554db657fa54763abd0c3a0aa9',
  '0x14dc79964da2c08b23698b3d3cc7ca32193d9955',
  '0x23618e81e3f5cdf7f54c3d65f7fbc0abf5b21e8f',
  '0xa0ee7a142d267c1f36714e4a8f75612f20a79720',
]

const LATEST_BLOCK_NUM = 1000

const getAddresses = (startIdx: ethers.BigNumber, endIdx: ethers.BigNumber) => {
  const lastIdx = endIdx.gte(ethers.BigNumber.from(DEFAULT_EXPECTED_ADDRESSES.length))
    ? DEFAULT_EXPECTED_ADDRESSES.length - 1
    : endIdx.toNumber()
  return DEFAULT_EXPECTED_ADDRESSES.slice(startIdx.toNumber(), lastIdx + 1)
}

jest.mock('ethers', () => {
  const originalModule = jest.requireActual('ethers')

  return {
    ...originalModule,
    ethers: {
      ...originalModule.ethers,
      providers: {
        JsonRpcProvider: function (): ethers.providers.JsonRpcProvider {
          return {} as ethers.providers.JsonRpcBatchProvider
        },
      },
      Contract: jest.fn().mockImplementation(() => ({
        getPoRAddressListLength: jest
          .fn()
          .mockReturnValue(originalModule.BigNumber.from(DEFAULT_EXPECTED_ADDRESSES.length)),
        getPoRAddressList: jest.fn().mockImplementation(getAddresses),
      })),
    },
  }
})

describe('address endpoint', () => {
  describe('#fetchAddressList', () => {
    describe('confirmations', () => {
      it('reads from the latest block if confirmations is 0', async () => {
        const addressManager = new DefaultAddressManager(
          '',
          [],
          new ethers.providers.JsonRpcProvider(),
        )

        const confirmations = 0
        const batchSize = DEFAULT_EXPECTED_ADDRESSES.length

        await addressManager.fetchAddressList(LATEST_BLOCK_NUM, confirmations, batchSize)

        expect(addressManager.contract.getPoRAddressListLength).toHaveBeenCalledWith({
          blockTag: LATEST_BLOCK_NUM,
        })
        expect(addressManager.contract.getPoRAddressList).toHaveBeenCalledWith(
          ethers.BigNumber.from(0),
          ethers.BigNumber.from(DEFAULT_EXPECTED_ADDRESSES.length - 1),
          { blockTag: LATEST_BLOCK_NUM },
        )
      })

      it('uses the correct number of confirmations if it is greater than 0', async () => {
        const addressManager = new DefaultAddressManager(
          '',
          [],
          new ethers.providers.JsonRpcProvider(),
        )

        const confirmations = 2
        const batchSize = DEFAULT_EXPECTED_ADDRESSES.length

        await addressManager.fetchAddressList(LATEST_BLOCK_NUM, confirmations, batchSize)

        expect(addressManager.contract.getPoRAddressListLength).toHaveBeenCalledWith({
          blockTag: LATEST_BLOCK_NUM - confirmations,
        })
        expect(addressManager.contract.getPoRAddressList).toHaveBeenCalledWith(
          ethers.BigNumber.from(0),
          ethers.BigNumber.from(DEFAULT_EXPECTED_ADDRESSES.length - 1),
          { blockTag: LATEST_BLOCK_NUM - confirmations },
        )
      })
    })

    it('fetches the whole address list if the batch size is greater than the size of the address list', async () => {
      const addressManager = new DefaultAddressManager(
        '',
        [],
        new ethers.providers.JsonRpcProvider(),
      )

      const confirmations = 0
      const batchSize = DEFAULT_EXPECTED_ADDRESSES.length * 2

      const result = await addressManager.fetchAddressList(
        LATEST_BLOCK_NUM,
        confirmations,
        batchSize,
      )

      verifyAddressListMatches(result, DEFAULT_EXPECTED_ADDRESSES)
    })

    it('fetches the whole address list if the batch size is smaller than the size of the address list', async () => {
      const addressManager = new DefaultAddressManager(
        '',
        [],
        new ethers.providers.JsonRpcProvider(),
      )

      const confirmations = 0
      const batchSize = 3

      const result = await addressManager.fetchAddressList(
        LATEST_BLOCK_NUM,
        confirmations,
        batchSize,
      )

      verifyAddressListMatches(result, DEFAULT_EXPECTED_ADDRESSES)

      expect(addressManager.contract.getPoRAddressList).toBeCalledTimes(4)
      expect(addressManager.contract.getPoRAddressList).toHaveBeenNthCalledWith(
        1,
        ethers.BigNumber.from(0),
        ethers.BigNumber.from(2),
        { blockTag: LATEST_BLOCK_NUM - confirmations },
      )
      expect(addressManager.contract.getPoRAddressList).toHaveBeenNthCalledWith(
        2,
        ethers.BigNumber.from(3),
        ethers.BigNumber.from(5),
        { blockTag: LATEST_BLOCK_NUM - confirmations },
      )
      expect(addressManager.contract.getPoRAddressList).toHaveBeenNthCalledWith(
        3,
        ethers.BigNumber.from(6),
        ethers.BigNumber.from(8),
        { blockTag: LATEST_BLOCK_NUM - confirmations },
      )
      expect(addressManager.contract.getPoRAddressList).toHaveBeenNthCalledWith(
        4,
        ethers.BigNumber.from(9),
        ethers.BigNumber.from(DEFAULT_EXPECTED_ADDRESSES.length - 1),
        { blockTag: LATEST_BLOCK_NUM - confirmations },
      )
    })

    it('waits for a group of fetches to finish before fetching more', async () => {
      const addressManager = new DefaultAddressManager(
        '',
        [],
        new ethers.providers.JsonRpcProvider(),
      )

      const resolvers: (() => void)[] = []
      const getAddressesDelayed = (startIdx: ethers.BigNumber, endIdx: ethers.BigNumber) => {
        const answer = getAddresses(startIdx, endIdx)
        return new Promise((resolve) => {
          resolvers.push(() => resolve(answer))
        })
      }

      addressManager.contract.getPoRAddressList.mockImplementation(getAddressesDelayed)

      const confirmations = 0
      const batchSize = 2
      const batchGroupSize = 2

      expect(resolvers.length).toBe(0)

      const resultPromise = addressManager.fetchAddressList(
        LATEST_BLOCK_NUM,
        confirmations,
        batchSize,
        batchGroupSize,
      )

      await sleep(0)

      expect(resolvers.length).toBe(2)
      expect(addressManager.contract.getPoRAddressList).toBeCalledTimes(2)
      expect(addressManager.contract.getPoRAddressList).toHaveBeenNthCalledWith(
        1,
        ethers.BigNumber.from(0),
        ethers.BigNumber.from(1),
        { blockTag: LATEST_BLOCK_NUM - confirmations },
      )
      expect(addressManager.contract.getPoRAddressList).toHaveBeenNthCalledWith(
        2,
        ethers.BigNumber.from(2),
        ethers.BigNumber.from(3),
        { blockTag: LATEST_BLOCK_NUM - confirmations },
      )

      resolvers[0]()
      resolvers[1]()
      await sleep(0)

      expect(resolvers.length).toBe(4)
      expect(addressManager.contract.getPoRAddressList).toBeCalledTimes(4)
      expect(addressManager.contract.getPoRAddressList).toHaveBeenNthCalledWith(
        3,
        ethers.BigNumber.from(4),
        ethers.BigNumber.from(5),
        { blockTag: LATEST_BLOCK_NUM - confirmations },
      )
      expect(addressManager.contract.getPoRAddressList).toHaveBeenNthCalledWith(
        4,
        ethers.BigNumber.from(6),
        ethers.BigNumber.from(7),
        { blockTag: LATEST_BLOCK_NUM - confirmations },
      )

      resolvers[2]()
      resolvers[3]()
      await sleep(0)

      expect(resolvers.length).toBe(5)
      expect(addressManager.contract.getPoRAddressList).toBeCalledTimes(5)
      expect(addressManager.contract.getPoRAddressList).toHaveBeenNthCalledWith(
        5,
        ethers.BigNumber.from(8),
        ethers.BigNumber.from(9),
        { blockTag: LATEST_BLOCK_NUM - confirmations },
      )

      resolvers[4]()
      await sleep(0)

      verifyAddressListMatches(await resultPromise, DEFAULT_EXPECTED_ADDRESSES)
    })
  })
})

const verifyAddressListMatches = (actual: string[][], expected: string[]) => {
  expect(actual.flat().length).toEqual(DEFAULT_EXPECTED_ADDRESSES.length)
  for (let i = 0; i < DEFAULT_EXPECTED_ADDRESSES.length; i++) {
    expect(actual.flat()[i]).toEqual(expected[i])
  }
}
