import { ethers } from 'ethers'

// Well-known test private key (Hardhat account #0)
export const TEST_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
export const TEST_WALLET = new ethers.Wallet(TEST_PRIVATE_KEY)
export const TEST_AUDITOR_ADDRESS = TEST_WALLET.address // 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

// EIP-712 domain matching rwa-gateway: name="RWA Attestation", version="1", verifyingContract=null address
export const EIP712_DOMAIN = {
  name: 'RWA Attestation',
  version: '1',
  chainId: 11155111,
  verifyingContract: '0x0000000000000000000000000000000000000000',
}

// NAVAttestation EIP-712 types matching rwa-gateway
export const EIP712_TYPES = {
  NAVAttestation: [
    { name: 'contractAddress', type: 'address' },
    { name: 'navContractAddress', type: 'address' },
    { name: 'decimals', type: 'uint8' },
    { name: 'amount', type: 'uint256' },
    { name: 'cumulativeAmount', type: 'uint256' },
    { name: 'validFrom', type: 'uint256' },
    { name: 'validTo', type: 'uint256' },
    { name: 'nonce', type: 'bytes32' },
  ],
}

// Sample NAV attestation message
export const NAV_MESSAGE = {
  contractAddress: '0x2224e19fee054e389e7e3df4b5e83e3e2e4cdb30',
  navContractAddress: '0xde2a8abde43e2fa11aa0f9669b52d13131b1af94',
  decimals: 8,
  amount: '2479938340000',
  cumulativeAmount: '5954903980000',
  validFrom: '1765429200',
  validTo: '0',
  nonce: '0x310e93ca00000000000000000000000000000000000000000000000000000000',
}

// Full EIP-712 typed data as stored in the database attestation_data column
export const ATTESTATION_DATA = {
  types: {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ],
    ...EIP712_TYPES,
  },
  primaryType: 'NAVAttestation',
  domain: {
    name: 'RWA Attestation',
    version: '1',
    chainId: '11155111',
    verifyingContract: '0x0000000000000000000000000000000000000000',
  },
  message: NAV_MESSAGE,
}

/**
 * Build a mock attestation row with a valid EIP-712 signature.
 * Signs the typed data with the test wallet so ecrecover in the transport will verify.
 */
export async function buildMockAttestationRow() {
  // Checksum address fields for signing (ethers requires valid EIP-55 checksums)
  // The stored ATTESTATION_DATA keeps lowercase — transport checksums at verify time
  const checksummedMessage: Record<string, unknown> = { ...NAV_MESSAGE }
  for (const field of EIP712_TYPES.NAVAttestation) {
    if (field.type === 'address' && checksummedMessage[field.name]) {
      checksummedMessage[field.name] = ethers.getAddress(checksummedMessage[field.name] as string)
    }
  }
  const signature = await TEST_WALLET.signTypedData(EIP712_DOMAIN, EIP712_TYPES, checksummedMessage)
  return {
    chain_id: 11155111,
    fractional_contract_address: '0x2224e19fee054e389e7e3df4b5e83e3e2e4cdb30',
    fractional_unit: 'RWAFractionalToken_GOLD_Proxy',
    nav_contract_address: '0xde2a8abde43e2fa11aa0f9669b52d13131b1af94',
    nav_contract_address_verified: '0xde2a8abde43e2fa11aa0f9669b52d13131b1af94',
    attested_decimals: 8,
    cumulative_amount_wei: '5954903980000',
    cumulative_amount_human: 59549.0398,
    auditor_account_address: TEST_AUDITOR_ADDRESS,
    auditor_signature: signature,
    attestation_data: JSON.stringify(ATTESTATION_DATA),
    attestor_timestamp: '2025-12-10T12:00:00.000Z',
  }
}

export const mockExecute = (rows: Record<string, unknown>[]) => ({
  rows,
  columns: Object.keys(rows[0] || {}),
  rowsAffected: 0,
  lastInsertRowid: undefined,
})
