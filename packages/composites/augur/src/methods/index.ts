import { ethers } from 'ethers'
import {
  CryptoMarketFactoryV3,
  CryptoMarketFactoryV3__factory,
  MLBMarketFactoryV3,
  MLBMarketFactoryV3__factory,
  MMAMarketFactoryV3,
  MMAMarketFactoryV3__factory,
  NBAMarketFactoryV3,
  NBAMarketFactoryV3__factory,
  NFLMarketFactoryV3,
  NFLMarketFactoryV3__factory,
} from '../typechain'

export * as resolveMarkets from './resolveMarkets'
export * as createMarkets from './createMarkets'
export * as pokeMarkets from './pokeMarkets'

export const TEAM_SPORTS = ['mlb', 'nba', 'nfl', 'ncaa-fb']
export const FIGHTER_SPORTS = ['mma']

export const bytesMappingToHexStr = (mapping: number[], encoded: string): string => {
  const buf = Buffer.from(encoded.substr(2), 'hex')

  // Get only the mapped amount of bytes
  const elems = mapping.map((bytes, index) => {
    const offset = 32 * (index + 1)
    return buf.slice(offset - bytes, offset)
  })

  // Right pad string to get 32 bytes
  const missingBytes = 32 - mapping.reduce((sum, bytes) => sum + bytes)
  elems.push(...new Array(missingBytes).fill(new Uint8Array(1).fill(0)))
  return `0x${Buffer.concat(elems).toString('hex')}`
}

export const CONTRACT_IDENTIFIERS = ['nfl', 'nba', 'mlb', 'mma', 'crypto'] as const

export type ContractIdentifier = typeof CONTRACT_IDENTIFIERS[number]

export function isContractIdentifier(s: string): s is ContractIdentifier {
  return CONTRACT_IDENTIFIERS.includes(s as ContractIdentifier)
}

export function getContract(
  identifier: ContractIdentifier,
  address: string,
  signer: ethers.Signer,
) {
  if (identifier === 'nfl') return NFLMarketFactoryV3__factory.connect(address, signer)
  if (identifier === 'nba') return NBAMarketFactoryV3__factory.connect(address, signer)
  if (identifier === 'mlb') return MLBMarketFactoryV3__factory.connect(address, signer)
  if (identifier === 'mma') return MMAMarketFactoryV3__factory.connect(address, signer)
  if (identifier === 'crypto') return CryptoMarketFactoryV3__factory.connect(address, signer)
  else throw Error(`Unsupported identifier ${identifier}`)
}

export function isNFL(
  contract: ethers.Contract,
  identifier: string,
): contract is NFLMarketFactoryV3 {
  contract
  return identifier === 'nfl'
}

export function isNBA(
  contract: ethers.Contract,
  identifier: string,
): contract is NBAMarketFactoryV3 {
  contract
  return identifier === 'nba'
}

export function isMLB(
  contract: ethers.Contract,
  identifier: string,
): contract is MLBMarketFactoryV3 {
  contract
  return identifier === 'mlb'
}

export function isMMA(
  contract: ethers.Contract,
  identifier: string,
): contract is MMAMarketFactoryV3 {
  contract
  return identifier === 'mma'
}

export function isCrypto(
  contract: ethers.Contract,
  identifier: ContractIdentifier,
): contract is CryptoMarketFactoryV3 {
  contract
  return identifier === 'crypto'
}
