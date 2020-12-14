import { ethers } from 'ethers'
import { util } from '@chainlink/ea-bootstrap'
import moment from 'moment'

type IndexData = {
  latestIndex: number
  updatedAt: moment.Moment
}

const ABI = [
  {
    inputs: [],
    name: 'latestRoundData',
    outputs: [
      {
        internalType: 'uint80',
        name: 'roundId',
        type: 'uint80',
      },
      {
        internalType: 'int256',
        name: 'answer',
        type: 'int256',
      },
      {
        internalType: 'uint256',
        name: 'startedAt',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'updatedAt',
        type: 'uint256',
      },
      {
        internalType: 'uint80',
        name: 'answeredInRound',
        type: 'uint80',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]

export const getIndex = async (oracleAddress: string): Promise<IndexData> => {
  const rpcUrl = util.getRequiredEnv('RPC_URL')
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  const onChainOracle = new ethers.Contract(oracleAddress, ABI, provider)
  const { answer: latestIndex, updatedAt } = await onChainOracle.latestRoundData()
  return {
    latestIndex,
    updatedAt: moment.unix(updatedAt),
  }
}
