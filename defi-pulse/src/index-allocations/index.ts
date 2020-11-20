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
  return {
    components: [
      '0x6b175474e89094c44da98b954eedeac495271d0f',
      '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
    ],
    units: [1100000000000000000, 2320000000000000000],
  }
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
