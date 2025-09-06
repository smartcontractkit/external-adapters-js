import type { Program } from '@coral-xyz/anchor'
import * as anchor from '@coral-xyz/anchor'
import * as YieldVaultIDL from '../idl/eusx_yield_vault.json'
import type { YieldVault } from '../types/eusx_yield_vault'

// Wrapper to create the yield vault anchor program
export const createYieldVaultProgram = (provider: anchor.Provider): Program<YieldVault> => {
  return new anchor.Program<YieldVault>(YieldVaultIDL, provider)
}
