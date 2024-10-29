import { ethers } from 'ethers'
import FundValueCalculatorRouter from '../abi/FundValueCalculatorRouter.json'

export const getEnzymeVaultBalance = async (
  provider: ethers.JsonRpcProvider,
  calculatorContract: string,
  quoteAsset: string,
  nexusVaultContract: string,
): Promise<bigint> => {
  const contract = new ethers.Contract(calculatorContract, FundValueCalculatorRouter, provider)

  return BigInt(await contract.calcNavInAsset.staticCall(nexusVaultContract, quoteAsset))
}
