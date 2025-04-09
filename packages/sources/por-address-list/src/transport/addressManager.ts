import { GroupRunner } from '@chainlink/external-adapter-framework/util/group-runner'
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
    const numAddresses = (await this.contract.getPoRAddressListLength({ blockTag })).toNumber()
    const batchRequests: Promise<T>[] = []

    const runner = new GroupRunner(batchGroupSize)
    const getPoRAddressListCall = runner.wrapFunction(this.getPoRAddressListCall.bind(this))

    for (let startIndex = 0; startIndex < numAddresses; startIndex += batchSize) {
      const endIndex = Math.min(startIndex + batchSize, numAddresses)
      batchRequests.push(
        getPoRAddressListCall(
          ethers.BigNumber.from(startIndex),
          // Subtract 1 because endIndex is inclusive
          ethers.BigNumber.from(endIndex - 1),
          blockTag,
        ),
      )
    }

    const addresses = await Promise.all(batchRequests)

    if (addresses.length == 0) {
      logger.error('Received empty PoRAddressList')
    }

    return addresses
  }

  abstract getPoRAddressListCall(
    start: ethers.BigNumber,
    end: ethers.BigNumber,
    blockTag: number,
  ): Promise<T>

  abstract processPoRAddressList(result: T[], network: string, chainId: string): PoRAddress[]
}

type DefaultAddressManagerResponseType = string[]
export class DefaultAddressManager extends AddressManager<DefaultAddressManagerResponseType> {
  getPoRAddressListCall(start: ethers.BigNumber, end: ethers.BigNumber, blockTag: number) {
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
  getPoRAddressListCall(start: ethers.BigNumber, end: ethers.BigNumber, blockTag: number) {
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
