import * as IPFS_Adapter from '@chainlink/ipfs-adapter'
import {
  calcMarketMakerRewards,
  calcRetroactiveRewards,
  calcTraderRewards,
  calculateRewards,
  constructJsonTree,
  constructMerkleTree,
  deconstructJsonTree,
  Input,
} from '../../src/method/poke'
import { BigNumber } from 'ethers'
import * as bn from 'bignumber.js'
import rewardsTestData1 from '../mock-data/rewards-test-data-1.json'
import expectedTestData1 from '../mock-data/expected-test-data-1.json'
import expectedTestData2 from '../mock-data/expected-test-data-2.json'
import { AddressRewards, storeJsonTree } from '../../src/ipfs-data'

// TODO: Should be updated, as it contains old object params
/*describe('rewards', () => {
  const jobRunID = '1'
  const ipfs = IPFS_Adapter.makeExecute()
  const defaultInput: Input = {
    traderRewardsAmount: new bn.BigNumber('5e23'),
    marketMakerRewardsAmount: new bn.BigNumber('2e23'),
    ipnsName: 'k51qzi5uqu5dhj7wupb2cuyu73b6xvpcf6258im75g79l3es2tzt6psy66uei2', // k51qzi5uqu5dlkb9yviadsfl3uxndbkyhf4n97u1t1np5e9f67zwmjz6yk9m9k
    traderScoreAlpha: 0.7,
    newEpoch: BigNumber.from(0),
    activeRootIpfsCid: 'bafkreigx6x553cdksm5gj2hh2fkhs2csjnmnny3zxp3tcyzevfj3f3ekli',
    treasuryClaimAddress: '0x95EaBB0248D013b9F59c5D5256CE11b0a8140B54',
  }
  const rewards = deconstructJsonTree(mockRewards)

  it('should calculate the correct rewards for epoch 0', async () => {
    const addressRewards = await calculateRewards(jobRunID, defaultInput, ipfs)
    expect(addressRewards).toEqual(rewards)
  })

  it('should add cumulative rewards after epoch 0', async () => {
    const input = {
      ...defaultInput,
      newEpoch: BigNumber.from(1),
    }

    // We expect the cumulative rewards for epoch 1 to be twice as much as epoch 0
    const expectedRewards = Object.keys(rewards).reduce(
      (obj, addr) => ({
        ...obj,
        [addr]: rewards[addr].mul(2),
      }),
      {},
    )

    const addressRewards = await calculateRewards(jobRunID, input, ipfs)
    expect(addressRewards).toEqual(expectedRewards)
  })
})*/

describe('rewards', () => {
  const jobRunID = '1'
  const ipfs = IPFS_Adapter.makeExecute()
  const defaultInput: Input = {
    traderRewardsAmount: new bn.BigNumber('3835616e18'),
    marketMakerRewardsAmount: new bn.BigNumber('1150685e18'),
    ipnsName: 'k51qzi5uqu5dlo5nc3rs61zs37bm6cx64s7ubrwvehj50f69361dtblsh4yxxk',
    traderScoreAlpha: 0.7,
    newEpoch: BigNumber.from(0),
    activeRootIpfsCid: 'bafkreigx6x553cdksm5gj2hh2fkhs2csjnmnny3zxp3tcyzevfj3f3ekli',
    treasuryClaimAddress: '0x95EaBB0248D013b9F59c5D5256CE11b0a8140B54',
  }
  const rewards = deconstructJsonTree(expectedTestData2)
  const expectedIpfsCid = 'bafkreie6eoruspwun3iygjfsxna647jgm3rlkqxnz6zlrpmydrwde6okqm'
  const expectedMerkleRoot = '8c3138fe5f69201e3dff8c1f1d034cfa6b7fd3d0cb263baec93175da9a5c7aeb'

  it('should calculate the correct rewards for epoch 0', async () => {
    const addressRewards = await calculateRewards(jobRunID, defaultInput, ipfs)
    expect(addressRewards).toEqual(rewards)

    const merkleTree = constructMerkleTree(addressRewards)
    const jsonTree = constructJsonTree(addressRewards)

    expect(merkleTree.getRoot().toString('hex')).toEqual(expectedMerkleRoot)

    const newIpfsCid = await storeJsonTree(jobRunID, ipfs, jsonTree)
    expect(newIpfsCid).toEqual(expectedIpfsCid)
  })
})

describe('calculate retroactive rewards', () => {
  const jobRunID = '1'
  const ipfs = IPFS_Adapter.makeExecute()
  const treasuryClaimAddress = '0x95EaBB0248D013b9F59c5D5256CE11b0a8140B54'
  const expectedMerkleRoot = '41f9ff21e8f74f7f0e8f0ef5dec38b18075b8849a08a6a281f66a181bc409e34'
  const expectedIpfsCid = 'bafkreicybmu5ce2ujt6cr5gwrhzkyxghfvaxodihadfq2cngryxokzotum'

  it('should calculate the correct rewards for epoch 0', async () => {
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

    expect(jsonTree).toEqual(expectedTestData1)
    expect(merkleTree.getRoot().toString('hex')).toEqual(expectedMerkleRoot)

    const newIpfsCid = await storeJsonTree(jobRunID, ipfs, jsonTree)
    expect(newIpfsCid).toEqual(expectedIpfsCid)
  })
})
