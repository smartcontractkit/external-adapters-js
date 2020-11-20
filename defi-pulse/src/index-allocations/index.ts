import { ethers } from 'ethers'
import { util } from '@chainlink/ea-bootstrap'

const SetABI = [
  'function getComponents() external view returns (address[] memory)',
  'function getUnits() external view returns (uint256[] memory)',
]

type Allocations = {
  components: string[]
  units: number[]
}

export const getAllocations = async (setAddress: string): Promise<Allocations> => {
  try {
    const rpcUrl = util.getRequiredEnv('RPC_URL')
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
    const set = new ethers.Contract(setAddress, SetABI, provider)
    const components = await set.getComponents()
    // const units = await set.getUnits()
    return {
      components,
      units: [],
    }
  } catch (e) {
    console.log(e)
    throw e
  }
}
