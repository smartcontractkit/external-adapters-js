import { ethers } from 'ethers'
import { util } from '@chainlink/ea-bootstrap'

type Allocations = {
  components: string[]
  units: number[]
}

const ABI = [
  {
    inputs: [{ internalType: 'contract ISetToken', name: '_setToken', type: 'address' }],
    name: 'getAllocations',
    outputs: [
      { internalType: 'address[]', name: '', type: 'address[]' },
      { internalType: 'int256[]', name: '', type: 'int256[]' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]

export const getAllocations = async (
  contractAddress: string,
  setAddress: string,
): Promise<Allocations> => {
  const rpcUrl = util.getRequiredEnv('RPC_URL')
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  const index = new ethers.Contract(contractAddress, ABI, provider)
  const info = await index.getAllocations(setAddress)

  return {
    components: info[0],
    units: info[1],
  }
}
