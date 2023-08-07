import type { TInputParameters as AddressesInputParameters } from './addresses'
import type { TInputParameters as MembersInputParameters } from './members'

export type TInputParameters = AddressesInputParameters | MembersInputParameters

export * as addresses from './addresses'
export * as members from './members'
