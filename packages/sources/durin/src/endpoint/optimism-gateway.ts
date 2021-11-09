import { ADDRESS_MANAGER_ABI, STATE_COMMITMENT_CHAIN_ABI } from './abis'

import { Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/types'
import ethers from 'ethers'
import { Config } from '../config'
import { RLP } from 'ethers/lib/utils'
import MerkleTree from 'merkletreejs'
import { HandlerResponse } from '../types'
import { toInterface } from '../utils'

export const supportedEndpoints = ['optimism-gateway']

export interface ResponseSchema {
  data: {
    result: HandlerResponse
  }
}

interface StateRootBatchHeader {
  batchIndex: ethers.BigNumber
  batchRoot: string
  batchSize: ethers.BigNumber
  prevTotalElements: ethers.BigNumber
  extraData: string
}

export const inputParameters: InputParameters = {
  to: true,
  data: true,
  abi: true,
}

const CALL_TYPE_FN = 'address'
const RETURN_TYPE_FN = 'addressWithProof'

const ZERO_ADDRESS = '0x' + '00'.repeat(20)

const loadContractFromManager = async (
  contractInterface: ethers.ethers.ContractInterface,
  addressManager: ethers.Contract,
  provider: ethers.providers.JsonRpcProvider,
): Promise<ethers.Contract> => {
  const address = await addressManager.getAddress(name)
  if (address === ZERO_ADDRESS) {
    throw new Error(`Lib_AddressManager does not have a record for a contract named: ${name}`)
  }
  return new ethers.Contract(address, contractInterface, provider)
}

const getLatestStateBatchHeader = async (
  l1Provider: ethers.providers.JsonRpcProvider,
  addressManager: ethers.Contract,
): Promise<{
  batch: StateRootBatchHeader
  stateRoots: string[]
}> => {
  const stateCommitmentChain = await loadContractFromManager(
    STATE_COMMITMENT_CHAIN_ABI,
    addressManager,
    l1Provider,
  )
  for (
    let endBlock = await l1Provider.getBlockNumber();
    endBlock > 0;
    endBlock = Math.max(endBlock - 100, 0)
  ) {
    const startBlock = Math.max(endBlock - 100, 1)
    const events: ethers.Event[] = await stateCommitmentChain.queryFilter(
      stateCommitmentChain.filters.StateBatchAppended(),
      startBlock,
      endBlock,
    )
    console.log(`${events.length} events between ${startBlock} - ${endBlock}`)
    if (events.length > 0) {
      const event = events[events.length - 1]
      const tx = await l1Provider.getTransaction(event.transactionHash)
      const [stateRoots] = stateCommitmentChain.interface.decodeFunctionData(
        'appendStateBatch',
        tx.data,
      )
      return {
        batch: {
          batchIndex: event.args?._batchIndex,
          batchRoot: event.args?._batchRoot,
          batchSize: event.args?._batchSize,
          prevTotalElements: event.args?._prevTotalElements,
          extraData: event.args?._extraData,
        },
        stateRoots,
      }
    }
  }
  throw Error('No state root batches found')
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const { to: address, data, abi: optimismGatewayStubABI } = validator.validated
  const l1Provider = new ethers.providers.JsonRpcProvider(config.rpcUrl)
  const l2Provider = new ethers.providers.JsonRpcProvider(config.l2RpcUrl)
  const addressManager = new ethers.Contract(
    config.addressManagerContract,
    ADDRESS_MANAGER_ABI,
    l1Provider,
  )

  const args = ethers.utils.defaultAbiCoder.decode(
    toInterface(optimismGatewayStubABI).getFunction(CALL_TYPE_FN).inputs,
    '0x' + data.slice(10),
  )

  const node = args[0]
  const contract = new ethers.Contract(address, optimismGatewayStubABI, l1Provider)
  let stateBatchHeader: any
  try {
    stateBatchHeader = await getLatestStateBatchHeader(l1Provider, addressManager)
  } catch (e) {
    console.log('stateBatchHeader error', { e })
  }

  // The l2 block number we'll use is the last one in the state batch
  const l2BlockNumber = stateBatchHeader.batch.prevTotalElements.add(
    stateBatchHeader.batch.batchSize,
  )
  // Construct a merkle proof for the state root we need
  const elements = []
  for (let i = 0; i < Math.pow(2, Math.ceil(Math.log2(stateBatchHeader.stateRoots.length))); i++) {
    if (i < stateBatchHeader.stateRoots.length) {
      elements.push(stateBatchHeader.stateRoots[i])
    } else {
      elements.push(ethers.utils.keccak256('0x' + '00'.repeat(32)))
    }
  }
  const hash = (el: Buffer | string): Buffer => {
    return Buffer.from(ethers.utils.keccak256(el).slice(2), 'hex')
  }
  const leaves = elements.map((element) => {
    return Buffer.from(element.slice(2), 'hex')
  })
  const index = elements.length - 1
  const tree = new MerkleTree(leaves, hash)
  const treeProof = tree.getProof(leaves[index], index).map((element) => {
    return element.data
  })
  // Get the address for the L2 resolver contract, and the slot that contains the data we want
  const l2ResolverAddress = await contract.l2resolver()
  const addrSlot = ethers.utils.keccak256(node + '00'.repeat(31) + '01')
  // Get a proof of the contents of that slot at the required L2 block
  const tag = '0x' + ethers.BigNumber.from(l2BlockNumber).toHexString().slice(2).replace(/^0+/, '')
  const proof = await l2Provider.send('eth_getProof', [l2ResolverAddress, [addrSlot], tag])
  const ret = [
    node,
    {
      stateRoot: stateBatchHeader.stateRoots[index],
      stateRootBatchHeader: stateBatchHeader.batch,
      stateRootProof: {
        index,
        siblings: treeProof,
      },
      stateTrieWitness: RLP.encode(proof.accountProof),
      storageTrieWitness: RLP.encode(proof.storageProof[0].proof),
    },
  ]
  const result: HandlerResponse = {
    returnType: toInterface(optimismGatewayStubABI).getFunction(RETURN_TYPE_FN),
    response: ret,
  }
  return {
    jobRunID,
    result,
    statusCode: 200,
    data: {
      result,
    },
  }
}
