import { GroupRunner } from '@chainlink/external-adapter-framework/util/group-runner'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
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

  async latestRoundData(): Promise<bigint[]> {
    return this.runner.run(() => this.contract.latestRoundData())
  }

  async getRateFromLatestRoundData(): Promise<SharePriceType> {
    const [[_, answer], decimal] = await Promise.all([this.latestRoundData(), this.decimals()])
    return {
      value: answer,
      decimal: Number(decimal),
    }
  }
}

export const getNetworkEnvVar = (network: string, suffix: string): string => {
  const envVarName = `${network.toUpperCase()}${suffix}`
  const envVar = process.env[envVarName]
  if (!envVar) {
    throw new AdapterInputError({
      statusCode: 400,
      message: `Environment variable ${envVarName} is missing`,
    })
  }
  return envVar
}

export const getWithdrawalQueueLength = (
  contract: GroupedTokenContract,
  token: string = 'TBILL',
): Promise<bigint> => {
  if (token === 'USYC') {
    return Promise.resolve(BigInt(0))
  }
  return contract.getWithdrawalQueueLength()
}
