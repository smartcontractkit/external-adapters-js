import { GroupRunner } from '@chainlink/external-adapter-framework/util/group-runner'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import crypto from 'crypto'
import { ethers } from 'ethers'
import EACAggregatorProxy from '../config/EACAggregatorProxy.json'

export type OraclePriceType = {
  value: bigint
  decimal: number
}
export function signRequest(
  method: string,
  path: string,
  body: string = '',
  apiKey: string,
  apiSecret: string,
  params: Record<string, string> = {},
) {
  const timestamp = Date.now().toString()

  const qs = buildQuery(params)
  const pathWithQs = qs ? `${path}?${qs}` : path

  const preHash = `${timestamp}${method.toUpperCase()}${pathWithQs}${body}`
  const signature = crypto.createHmac('sha256', apiSecret).update(preHash, 'utf8').digest('hex')

  return {
    Authorization: `ApiKey ${apiKey}`,
    'X-Signature': signature,
    'X-Timestamp': timestamp,
  }
}

function buildQuery(params: Record<string, string>): string {
  return Object.entries(params)
    .map(
      ([key, val]) => `${encodeURIComponent(key)}=${val}`, // don’t encode commas in values
    )
    .join('&')
}

export async function getPrice(
  address: string,
  provider: ethers.providers.JsonRpcProvider,
): Promise<OraclePriceType> {
  const contract = new ethers.Contract(address, EACAggregatorProxy, provider)
  const [[_, answer], decimal] = await Promise.all([
    contract.latestRoundData(),
    contract.decimals(),
  ])
  return {
    value: answer,
    decimal: Number(decimal),
  }
}

export function toBigIntBalance(balance: string, decimals: number): bigint {
  const [whole, frac = ''] = balance.split('.')
  const fracPadded = frac.padEnd(decimals, '0')
  const normalized = whole + fracPadded.slice(0, decimals)
  return BigInt(normalized || '0')
}

export function toEvenHex(value: bigint): string {
  let hex = value.toString(16)
  if (hex.length % 2 !== 0) {
    hex = '0' + hex
  }
  return '0x' + hex
}

// Wraps a JsonRpcProvider to allow for grouping of requests to limit the
// number of concurrent requests.
// Its lifetime should not be longer than the lifetime of a request to the EA.
export class GroupedProvider {
  private readonly runner: GroupRunner

  constructor(private readonly provider: ethers.providers.JsonRpcProvider, groupSize: number) {
    this.runner = new GroupRunner(groupSize)
  }

  createPriceOracleContract(address: string): GroupedPriceOracleContract {
    return new GroupedPriceOracleContract(address, this.provider, this.runner)
  }
}

export class GroupedPriceOracleContract {
  private readonly contract: ethers.Contract

  constructor(
    address: string,
    provider: ethers.providers.JsonRpcProvider,
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

  async getRateFromLatestRoundData(): Promise<OraclePriceType> {
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
