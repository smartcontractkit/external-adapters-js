import { ethers } from 'ethers'

export const abi = [
  'function setBytes32(bytes32 _value)',
  'function getBytes32() view returns (bytes32)',
  'function setInt256(int256 _value)',
  'function getInt256() view returns (int256)',
  'function setUint256(uint256 _value)',
  'function getUint256() view returns (uint256)',
]

export const byteCode =
  '0x608060405234801561001057600080fd5b50610164806100206000396000f300' +
  '6080604052600436106100775763ffffffff7c01000000000000000000000000' +
  '000000000000000000000000000000006000350416631f903037811461007c57' +
  '806368895979146100a3578063a53b1c1e146100b8578063c2b12a73146100d2' +
  '578063d2282dc5146100ea578063f5b53e1714610102575b600080fd5b348015' +
  '61008857600080fd5b50610091610117565b6040805191825251908190036020' +
  '0190f35b3480156100af57600080fd5b5061009161011d565b3480156100c457' +
  '600080fd5b506100d0600435610123565b005b3480156100de57600080fd5b50' +
  '6100d0600435610128565b3480156100f657600080fd5b506100d06004356101' +
  '2d565b34801561010e57600080fd5b50610091610132565b60005481565b6001' +
  '5481565b600255565b600055565b600155565b600254815600a165627a7a7230' +
  '582062f6c7201e1a3698c586add5b8e7d1f047a1fcfd8ca2f518c06790fba3de' +
  '22d80029'

// https://docs.ethers.io/ethers.js/html/api-contract.html#deploying-a-contract
export async function deploy(privateKey: string, rpcUrl: string): Promise<string> {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  const wallet = new ethers.Wallet(privateKey, provider)
  const factory = new ethers.ContractFactory(abi, byteCode, wallet)
  const contract = await factory.deploy()
  console.log('Contract deployed at: ', contract.address)
  console.log('Transaction: ', contract.deployTransaction.hash)
  await contract.deployed()
  return contract.address
}
