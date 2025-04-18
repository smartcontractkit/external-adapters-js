import { GroupRunner } from '@chainlink/external-adapter-framework/util/group-runner'
import { ethers } from 'ethers'
import EACAggregatorProxy from '../config/EACAggregatorProxy.json'
import OpenEdenTBILLProxy from '../config/OpenEdenTBILLProxy.json'

export type SharePriceType = {
  value: bigint
  decimal: number
}

// Wraps a JsonRpcProvider to allow for grouping of requests to limit the
// number of concurrent requests.
// Its lifetime should not be longer than the lifetime of a request to the EA.
export class GroupedProvider {
  private readonly runner: GroupRunner

  constructor(private readonly provider: ethers.JsonRpcProvider, groupSize: number) {
    this.runner = new GroupRunner(groupSize)
  }

  createTokenContract(address: string): GroupedTokenContract {
    return new GroupedTokenContract(address, this.provider, this.runner)
  }

  createPriceOracleContract(address: string): GroupedPriceOracleContract {
    return new GroupedPriceOracleContract(address, this.provider, this.runner)
  }
}

export class GroupedTokenContract {
  private readonly contract: ethers.Contract

  constructor(
    address: string,
    provider: ethers.JsonRpcProvider,
    private readonly runner: GroupRunner,
  ) {
    this.contract = new ethers.Contract(address, OpenEdenTBILLProxy, provider)
  }

  async decimals(): Promise<bigint> {
    return this.runner.run(() => this.contract.decimals())
  }

  async balanceOf(walletAddress: string): Promise<bigint> {
    return this.runner.run(() => this.contract.balanceOf(walletAddress))
  }

  async getWithdrawalQueueLength(): Promise<bigint> {
    return this.runner.run(() => this.contract.getWithdrawalQueueLength())
  }

  async getWithdrawalQueueInfo(index: number): Promise<{
    sender: string
    receiver: string
    shares: bigint
  }> {
    return this.runner.run(() => this.contract.getWithdrawalQueueInfo(index))
  }
}

export class GroupedPriceOracleContract {
  private readonly contract: ethers.Contract

  constructor(
    address: string,
    provider: ethers.JsonRpcProvider,
    private readonly runner: GroupRunner,
  ) {
    this.contract = new ethers.Contract(address, EACAggregatorProxy, provider)
  }

  async decimals(): Promise<bigint> {
    return this.runner.run(() => this.contract.decimals())
  }

  async latestAnswer(): Promise<bigint> {
    return this.runner.run(() => this.contract.latestAnswer())
  }

  async getRate(): Promise<SharePriceType> {
    const [value, decimal] = await Promise.all([this.latestAnswer(), this.decimals()])
    return {
      value,
      decimal: Number(decimal),
    }
  }
}
