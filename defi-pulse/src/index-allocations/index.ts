import { ethers } from 'ethers'
import { util } from '@chainlink/ea-bootstrap'

type Allocations = {
  components: string[]
  units: number[]
}

const ABI = [
  'function getAllocations(ISetToken _setToken) external view returns(address[] memory, uint256[]memory)',
]

export const getAllocations = async (
  contractAddress: string,
  setAddress: string,
): Promise<Allocations> => {
  try {
    const rpcUrl = util.getRequiredEnv('RPC_URL')
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
    const index = new ethers.Contract(contractAddress, ABI, provider)
    const info = await index.getAllocations(setAddress)

    return {
      components: info.components,
      units: info.units,
    }
  } catch (e) {
    console.log(e)
    throw e
  }
}
