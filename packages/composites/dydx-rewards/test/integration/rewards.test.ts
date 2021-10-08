import * as IPFS_Adapter from '@chainlink/ipfs-adapter'
import {
  calcMarketMakerRewards,
  calcRetroactiveRewards,
  calcTraderRewards,
  constructJsonTree,
  constructMerkleTree,
} from '../../src/method/poke'
import * as bn from 'bignumber.js'
import rewardsTestData1 from '../mock-data/rewards-test-data-1.json'
import { AddressRewards, storeJsonTree } from '../../src/ipfs-data'
import nock from 'nock'
import { mockIpfsRetroactiveRewardsData, mockEthNode } from './fixtures'
import { makeExecute } from '../../src'

let oldEnv: NodeJS.ProcessEnv

beforeAll(() => {
  oldEnv = JSON.parse(JSON.stringify(process.env))
  process.env.CACHE_ENABLED = 'false'
  process.env.API_ENDPOINT = process.env.API_ENDPOINT || 'http://127.0.0.1:5001'
  process.env.RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545'
  process.env.PRIVATE_KEY =
    process.env.PRIVATE_KEY || '8da4ef21b864d2cc526dbdb2a120bd2874c36c9d0a1fb7f8c63d7f7a8b41de8f'
  process.env.API_VERBOSE = 'true'
  if (process.env.RECORD) {
    nock.recorder.rec()
  }
})

afterAll(() => {
  process.env = oldEnv
  if (process.env.RECORD) {
    nock.recorder.play()
  }

  nock.restore()
  nock.cleanAll()
  nock.enableNetConnect()
})

describe('calculating rewards', () => {
  const jobRunID = '1'
  const ipfs = IPFS_Adapter.makeExecute()
  const treasuryClaimAddress = '0x95EaBB0248D013b9F59c5D5256CE11b0a8140B54'

  it('should calculate the correct rewards for epoch 0', async () => {
    mockIpfsRetroactiveRewardsData()

    const addressRewards: AddressRewards = {}
    calcRetroactiveRewards(rewardsTestData1, addressRewards, treasuryClaimAddress)
    calcTraderRewards(
      rewardsTestData1,
      addressRewards,
      new bn.BigNumber(3_835_616).shiftedBy(18),
      0.7,
    )
    calcMarketMakerRewards(
      rewardsTestData1,
      addressRewards,
      new bn.BigNumber(1_150_685).shiftedBy(18),
    )

    const merkleTree = constructMerkleTree(addressRewards)
    const jsonTree = constructJsonTree(addressRewards)
    const newIpfsCid = await storeJsonTree(jobRunID, ipfs, jsonTree, {})

    expect({
      cid: newIpfsCid,
      root: merkleTree.getRoot().toString('hex'),
    }).toMatchSnapshot()
  })
})

describe('full request', () => {
  const jobRunID = '1'
  const dydxRewards = makeExecute()

  it('services request for epoch 0 correctly', async () => {
    mockIpfsRetroactiveRewardsData()
    const mockEth = mockEthNode()

    const req = {
      id: jobRunID,
      data: {
        ipnsName: 'k51qzi5uqu5dlmlt9vu0tp1o4hkwr9hrhl5oia4gf4qgpolsjkj7erk3hy2cvv',
        traderScoreAlpha: '700000000000000000',
        callbackAddress: '0xaffdA0625B24a28EBA18eb733c41C8481EC0D6D0',
        newEpoch: '0',
        activeRootIpfsCid: '',
      },
    }
    const response = await dydxRewards(req, {})
    expect(response).toMatchSnapshot()

    // Assert that the correct data was written on-chain
    expect(mockEth.isDone()).toBe(true)
  })
})
