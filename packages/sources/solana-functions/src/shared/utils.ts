import { type Address } from '@solana/addresses'
export const getProgramIdFromIdl = (idl: any): Address => {
  const idlAddr = (idl as any)?.address as string | undefined
  if (idlAddr) return idlAddr as Address
  throw new Error('Program ID not found in given IDL.')
}
