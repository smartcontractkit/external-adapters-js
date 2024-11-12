import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { Validator, Requester, AdapterDataProviderError, util } from '@chainlink/ea-bootstrap'
import { ethers } from 'ethers'

export const NAME = 'format'
export const supportedEndpoints = [NAME]

export const description =
  'The format endpoint encodes the chainId, block hash, and block receiptsRoot as bytes and returns that without a 0x prefix.'

export type TInputParameters = { url?: string; chainId?: string; blockNumber: number }

export const inputParameters: InputParameters<TInputParameters> = {
  chainId: {
    description: 'An identifier for which network of the blockchain to use',
    required: false,
  },
  blockNumber: {
    description: 'Block number to query for',
    required: true,
  },
}

type ResponseSchema = {
  difficulty: string
  extraData: string
  gasLimit: string
  gasUsed: string
  hash: string
  logsBloom: string
  miner: string
  mixHash: string
  nonce: string
  number: string
  parentHash: string
  receiptsRoot: string
  sha3Uncles: string
  size: string
  stateRoot: string
  timestamp: string
  totalDifficulty: string
  transactions: string[]
  transactionsRoot: string
  uncles: string[]
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl, config.chainId)
  const jobRunID = validator.validated.id

  const chainId = validator.validated.data.chainId
  const blockNumber = validator.validated.data.blockNumber

  try {
    const fullBlock: ResponseSchema = await provider.send('eth_getBlockByNumber', [
      ethers.utils.hexlify(blockNumber),
      false,
    ])
    const coder = new ethers.utils.AbiCoder()
    const encodedResult = coder.encode(
      ['uint8', 'bytes32', 'bytes32'],
      [chainId, fullBlock.hash, fullBlock.receiptsRoot],
    )
    const result = encodedResult.slice(2)
    return Requester.success(jobRunID, { data: { result } }, config.verbose)
  } catch (e: any) {
    throw new AdapterDataProviderError({
      network: 'ethereum',
      message: util.mapRPCErrorMessage(e?.code, e?.message),
      cause: e,
    })
  }
}
