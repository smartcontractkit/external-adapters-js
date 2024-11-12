import type { TInputParameters as getblockchaininfoInputParameters } from './getblockchaininfo'
import type { TInputParameters as scantxoutsetInputParameters } from './scantxoutset'

export type TInputParameters = getblockchaininfoInputParameters | scantxoutsetInputParameters

export * as getblockchaininfo from './getblockchaininfo'
export * as scantxoutset from './scantxoutset'
