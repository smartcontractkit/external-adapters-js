import { GroupRunner } from '@chainlink/external-adapter-framework/util/group-runner'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { Connection, PublicKey } from '@solana/web3.js'
import { ethers } from 'ethers'
import EACAggregatorProxy from '../config/EACAggregatorProxy.json'
import OpenEdenTBILLProxy from '../config/OpenEdenTBILLProxy.json'
import { inputParameters } from '../endpoint/usdoSolana'

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

export const getTokenBalance = async (
  addresses: typeof inputParameters.validated.addresses,
  tokenMint: typeof inputParameters.validated.tokenMint,
  connection?: Connection,
) => {
  if (!connection) {
    throw new AdapterInputError({
      statusCode: 400,
      message: 'SOLANA_RPC_URL is missing',
    })
  }

  const mint = new PublicKey(tokenMint.contractAddress.trim())

  // Query balances for each wallet
  const response = await Promise.all(
    addresses.map(async (wallet) =>
      connection.getParsedTokenAccountsByOwner(new PublicKey(wallet), {
        mint,
      }),
    ),
  )

  // Extract balances
  const result = response
    .flatMap((r) => r.value)
    .map((v) => ({
      value: BigInt(v.account.data.parsed.info.tokenAmount.amount),
      decimals: Number(v.account.data.parsed.info.tokenAmount.decimals),
    }))

  const formattedResponse = response
    .flatMap((r) => r.value)
    .map((r) => ({
      token: r.account.data.parsed.info.mint,
      wallet: r.account.data.parsed.info.owner,
      value: r.account.data.parsed.info.tokenAmount.amount,
      decimals: r.account.data.parsed.info.tokenAmount.decimals,
    }))

  return {
    result,
    formattedResponse,
  }
}
