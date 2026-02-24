jest.mock('@chainlink/external-adapter-framework/transports/abstract/subscription', () => ({
  SubscriptionTransport: class {},
}))

import { buildPorInputConfig, calculateRatio } from '../../src/transport/price'

describe('calculateRatio', () => {
  describe('ratio calculation', () => {
    it('calculates 1.05 ratio (105% collateralization) scaled by 1e18', () => {
      const aum = '10500000000000000000000000' // 10.5M * 1e18
      const totalSupply = '10000000000000000000000000' // 10M * 1e18

      const { result, ratio } = calculateRatio(aum, totalSupply)

      expect(result).toBe('1050000000000000000')
      expect(ratio).toBe('1.05')
    })

    it('calculates 1:1 ratio (100% collateralization) scaled by 1e18', () => {
      const aum = '10000000000000000000000000'
      const totalSupply = '10000000000000000000000000'

      const { result, ratio } = calculateRatio(aum, totalSupply)

      expect(result).toBe('1000000000000000000')
      expect(ratio).toBe('1')
    })

    it('calculates under-collateralized ratio (80%)', () => {
      const aum = '8000000000000000000000000'
      const totalSupply = '10000000000000000000000000'

      const { result, ratio } = calculateRatio(aum, totalSupply)

      expect(result).toBe('800000000000000000')
      expect(ratio).toBe('0.8')
    })

    it('calculates over-collateralized ratio (200%)', () => {
      const aum = '20000000000000000000000000'
      const totalSupply = '10000000000000000000000000'

      const { result, ratio } = calculateRatio(aum, totalSupply)

      expect(result).toBe('2000000000000000000')
      expect(ratio).toBe('2')
    })

    it('handles small values maintaining precision', () => {
      const aum = '1000000000000000000' // 1e18
      const totalSupply = '3000000000000000000' // 3e18

      const { result, ratio } = calculateRatio(aum, totalSupply)

      // 1/3 scaled by 1e18 should be approximately 333333333333333333
      expect(result).toBe('333333333333333333')
      expect(ratio).toMatch(/^0\.333/)
    })

    it('handles large values without overflow', () => {
      const aum = '100000000000000000000000000000000000' // 1e35
      const totalSupply = '50000000000000000000000000000000000' // 5e34

      const { result, ratio } = calculateRatio(aum, totalSupply)

      expect(result).toBe('2000000000000000000')
      expect(ratio).toBe('2')
    })
  })

  describe('error handling', () => {
    it('throws error when total supply is zero', () => {
      const aum = '10000000000000000000000000'
      const totalSupply = '0'

      expect(() => calculateRatio(aum, totalSupply)).toThrow(
        'Total supply is zero, cannot calculate ratio',
      )
    })

    it('handles zero AUM with non-zero total supply', () => {
      const aum = '0'
      const totalSupply = '10000000000000000000000000'

      const { result, ratio } = calculateRatio(aum, totalSupply)

      expect(result).toBe('0')
      expect(ratio).toBe('0')
    })
  })
})

describe('buildPorInputConfig', () => {
  const mockSettings = {
    POR_ADDRESS_LIST_CONTRACT: '0x69A22f0fc7b398e637BF830B862C75dd854b2BbF',
    CUSD_CONTRACT_ADDRESS: '0xcCcc62962d17b8914c62D74FfB843d73B2a3cccC',
  } as Parameters<typeof buildPorInputConfig>[0]

  it('generates config with three input entries', () => {
    const config = buildPorInputConfig(mockSettings)

    expect(config).toHaveLength(3)
  })

  describe('first entry (priced reserves)', () => {
    it('has correct protocol configuration', () => {
      const config = buildPorInputConfig(mockSettings)

      expect(config[0].protocol).toBe('por_address_list')
      expect(config[0].protocolEndpoint).toBe('openedenAddress')
      expect(config[0].type).toBe('priced')
    })

    it('uses POR_ADDRESS_LIST_CONTRACT setting', () => {
      const config = buildPorInputConfig(mockSettings)

      expect(config[0].contractAddress).toBe('0x69A22f0fc7b398e637BF830B862C75dd854b2BbF')
    })

    it('has correct indexer configuration for tbill', () => {
      const config = buildPorInputConfig(mockSettings)

      expect(config[0].indexer).toBe('token_balance')
      expect(config[0].indexerEndpoint).toBe('tbill')
    })
  })

  describe('second entry (pegged reserves)', () => {
    it('has correct protocol configuration', () => {
      const config = buildPorInputConfig(mockSettings)

      expect(config[1].protocol).toBe('por_address_list')
      expect(config[1].protocolEndpoint).toBe('openedenAddress')
      expect(config[1].type).toBe('pegged')
    })

    it('uses POR_ADDRESS_LIST_CONTRACT setting', () => {
      const config = buildPorInputConfig(mockSettings)

      expect(config[1].contractAddress).toBe('0x69A22f0fc7b398e637BF830B862C75dd854b2BbF')
    })

    it('has correct indexer configuration for evm', () => {
      const config = buildPorInputConfig(mockSettings)

      expect(config[1].indexer).toBe('token_balance')
      expect(config[1].indexerEndpoint).toBe('evm')
    })
  })

  describe('third entry (total borrows)', () => {
    it('has correct protocol configuration', () => {
      const config = buildPorInputConfig(mockSettings)

      expect(config[2].protocol).toBe('list')
      expect(config[2].indexer).toBe('view_function_multi_chain')
      expect(config[2].indexerEndpoint).toBe('function')
    })

    it('uses CUSD_CONTRACT_ADDRESS in indexerParams', () => {
      const config = buildPorInputConfig(mockSettings)

      expect(config[2].indexerParams.address).toBe('0xcCcc62962d17b8914c62D74FfB843d73B2a3cccC')
    })

    it('has correct function signature for totalBorrows', () => {
      const config = buildPorInputConfig(mockSettings)

      expect(config[2].indexerParams.signature).toBe(
        'function totalBorrows(address _asset) external view returns (uint256 totalBorrow)',
      )
    })

    it('passes USDC contract as input param', () => {
      const config = buildPorInputConfig(mockSettings)

      expect(config[2].indexerParams.inputParams).toEqual([
        '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      ])
    })

    it('has correct decimal configuration', () => {
      const config = buildPorInputConfig(mockSettings)

      expect(config[2].viewFunctionIndexerResultDecimals).toBe(6)
    })
  })

  describe('with different settings values', () => {
    it('uses provided contract addresses', () => {
      const customSettings = {
        POR_ADDRESS_LIST_CONTRACT: '0x1234567890123456789012345678901234567890',
        CUSD_CONTRACT_ADDRESS: '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
      } as Parameters<typeof buildPorInputConfig>[0]

      const config = buildPorInputConfig(customSettings)

      expect(config[0].contractAddress).toBe('0x1234567890123456789012345678901234567890')
      expect(config[1].contractAddress).toBe('0x1234567890123456789012345678901234567890')
      expect(config[2].indexerParams.address).toBe('0xABCDEF1234567890ABCDEF1234567890ABCDEF12')
    })
  })
})
