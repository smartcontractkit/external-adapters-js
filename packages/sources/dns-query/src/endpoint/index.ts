import type { TInputParameters as DnsQueryInputParameters } from './dnsQuery'
import type { TInputParameters as DnsProofInputParameters } from './dnsProof'

export type TInputParameters = DnsQueryInputParameters | DnsProofInputParameters

export * as dnsQuery from './dnsQuery'
export * as dnsProof from './dnsProof'
