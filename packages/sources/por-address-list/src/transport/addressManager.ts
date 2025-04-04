import { ethers } from 'ethers'
import { PoRAddress } from '@chainlink/external-adapter-framework/adapter/por'
import { makeLogger } from '@chainlink/external-adapter-framework/util'

const logger = makeLogger('por-address-manager')

export abstract class AddressManager<T> {
  contract: ethers.Contract

  constructor(
    contractAddress: string,
    abi: ethers.ContractInterface,
    provider: ethers.providers.JsonRpcProvider,
  ) {
    this.contract = new ethers.Contract(contractAddress, abi, provider)
  }

  async fetchAddressList(
    latestBlockNum: number,
    confirmations = 0,
    batchSize = 10,
    batchGroupSize = 10,
  ): Promise<T[]> {
    const blockTag = latestBlockNum - confirmations
    const numAddresses = await this.contract.getPoRAddressListLength({ blockTag })
    let totalRequestedAddressesCount = 0
    let startIdx = ethers.BigNumber.from(0)
    const addresses: T[] = []
    let batchRequests: Promise<T>[] = []

    while (totalRequestedAddressesCount < numAddresses.toNumber()) {
      const nextEndIdx = startIdx.add(batchSize - 1)
      const endIdx = nextEndIdx.gte(numAddresses) ? numAddresses.sub(1) : nextEndIdx
      const batchCall = this.getPoRAddressListCall(startIdx, endIdx, blockTag)
      batchRequests.push(batchCall)
      // element at endIdx is included in result
      const addressesRequested: number = endIdx.sub(startIdx).add(1).toNumber()
      totalRequestedAddressesCount += addressesRequested
      startIdx = endIdx.add(1)

      if (
        batchRequests.length >= batchGroupSize ||
        totalRequestedAddressesCount >= numAddresses.toNumber()
      ) {
        addresses.push(...(await Promise.all(batchRequests)))
        batchRequests = []
      }
    }

    if (addresses.length == 0) {
      logger.error('Received empty PoRAddressList')
    }

    return addresses
  }

  abstract getPoRAddressListCall(start: ethers.BigNumber, end: number, blockTag: number): Promise<T>

  abstract processPoRAddressList(result: T[], network: string, chainId: string): PoRAddress[]
}

type DefaultAddressManagerResponseType = string[]
export class DefaultAddressManager extends AddressManager<DefaultAddressManagerResponseType> {
  getPoRAddressListCall(start: ethers.BigNumber, end: number, blockTag: number) {
    return this.contract.getPoRAddressList(start, end, { blockTag })
  }

  processPoRAddressList(
    result: DefaultAddressManagerResponseType[],
    network: string,
    chainId: string,
  ) {
    return result
      .flat()
      .map((address) => ({
        address,
        network,
        chainId,
      }))
      .sort()
  }
}

type LombardAddressManagerResponseType = string[][]
export class LombardAddressManager extends AddressManager<LombardAddressManagerResponseType> {
  getPoRAddressListCall(start: ethers.BigNumber, end: number, blockTag: number) {
    return this.contract.getPoRAddressSignatureMessages(start.toNumber(), end, { blockTag })
  }

  processPoRAddressList(
    result: LombardAddressManagerResponseType[],
    network: string,
    chainId: string,
  ) {
    return result
      .flatMap((r) => r[0])
      .filter((address) => address != '')
      .map((address) => ({
        address: address.replace("'", ''),
        network: network,
        chainId: chainId,
      }))
      .sort()
  }
}
