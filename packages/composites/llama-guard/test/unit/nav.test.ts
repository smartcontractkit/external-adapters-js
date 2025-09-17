import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { JsonRpcProvider } from 'ethers'
import { getBounds } from '../../src/transport/contract'
import { getRawNav } from '../../src/transport/ea'
import { getNav } from '../../src/transport/nav'

jest.mock('../../src/transport/ea')
jest.mock('../../src/transport/contract')

const mockGetRawNav = getRawNav as jest.MockedFunction<typeof getRawNav>
const mockGetBounds = getBounds as jest.MockedFunction<typeof getBounds>

const now = 1000000000000

describe('getNav', () => {
  const defaultParams = {
    ea: 'test-ea',
    eaInput: '{}',
    requester: {} as Requester,
    asset: 'test-asset',
    registry: 'test-registry',
    provider: {} as JsonRpcProvider,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(Date, 'now').mockReturnValue(now)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('no bounds', () => {
    it('should return rawNav', async () => {
      mockGetRawNav.mockResolvedValue(1)
      mockGetBounds.mockResolvedValue({
        lower: {
          isLowerBoundEnabled: false,
          latestNav: 0n,
          latestTime: 0,
          maxDiscount: 0,
          lowerBoundTolerance: 0,
        },
        upper: {
          isUpperBoundEnabled: false,
          lookbackNav: 0n,
          lookbackTime: 0,
          maxExpectedApy: 0,
          upperBoundTolerance: 0,
        },
        decimals: 2,
      })

      const result = await getNav(
        defaultParams.ea,
        defaultParams.eaInput,
        defaultParams.requester,
        defaultParams.asset,
        defaultParams.registry,
        defaultParams.provider,
      )

      expect(result).toEqual({
        rawNav: '100',
        adjustedNav: '100',
        decimals: 2,
        bounds: {
          lowerBound: '',
          upperBound: '',
        },
        bases: {
          lookback: { nav: '0', ts: 0 },
          previous: { nav: '0', ts: 0 },
        },
        riskFlag: false,
        breachDirection: '',
        isBounded: true,
      })
    })
  })

  describe('lowerBound', () => {
    it('should return lowerBound', async () => {
      mockGetRawNav.mockResolvedValue(1.4)
      mockGetBounds.mockResolvedValue({
        lower: {
          isLowerBoundEnabled: true,
          latestNav: 150n,
          latestTime: now / 1000 - 86400 / 2,
          maxDiscount: 25,
          lowerBoundTolerance: 50,
        },
        upper: {
          isUpperBoundEnabled: false,
          lookbackNav: 0n,
          lookbackTime: 0,
          maxExpectedApy: 0,
          upperBoundTolerance: 0,
        },
        decimals: 2,
      })

      const result = await getNav(
        defaultParams.ea,
        defaultParams.eaInput,
        defaultParams.requester,
        defaultParams.asset,
        defaultParams.registry,
        defaultParams.provider,
      )

      expect(result).toEqual({
        rawNav: '140',
        adjustedNav: '148',
        bounds: {
          lowerBound: '148',
          upperBound: '',
        },
        bases: {
          lookback: { nav: '0', ts: 0 },
          previous: { nav: '150', ts: now / 1000 - 86400 / 2 },
        },
        decimals: 2,
        riskFlag: true,
        breachDirection: 'lower',
        isBounded: false,
      })
    })
  })

  describe('upperBound', () => {
    it('should return upperBound', async () => {
      mockGetRawNav.mockResolvedValue(1.006)
      mockGetBounds.mockResolvedValue({
        lower: {
          isLowerBoundEnabled: false,
          latestNav: 0n,
          latestTime: 0,
          maxDiscount: 0,
          lowerBoundTolerance: 0,
        },
        upper: {
          isUpperBoundEnabled: true,
          lookbackNav: 1000n,
          lookbackTime: now / 1000 - 86400 / 2,
          maxExpectedApy: 25,
          upperBoundTolerance: 50,
        },
        decimals: 3,
      })

      const result = await getNav(
        defaultParams.ea,
        defaultParams.eaInput,
        defaultParams.requester,
        defaultParams.asset,
        defaultParams.registry,
        defaultParams.provider,
      )

      expect(result).toEqual({
        rawNav: '1006',
        adjustedNav: '1005',
        bounds: {
          lowerBound: '',
          upperBound: '1005',
        },
        bases: {
          lookback: { nav: '1000', ts: now / 1000 - 86400 / 2 },
          previous: { nav: '0', ts: 0 },
        },
        decimals: 3,
        riskFlag: false,
        breachDirection: 'upper',
        isBounded: false,
      })
    })
  })

  describe('with in bound', () => {
    it('should return rawNav', async () => {
      mockGetRawNav.mockResolvedValue(1.001)
      mockGetBounds.mockResolvedValue({
        lower: {
          isLowerBoundEnabled: true,
          latestNav: 1000n,
          latestTime: now / 1000 - 86400 / 2,
          maxDiscount: 25,
          lowerBoundTolerance: 50,
        },
        upper: {
          isUpperBoundEnabled: true,
          lookbackNav: 1000n,
          lookbackTime: now / 1000 - 86400 / 2,
          maxExpectedApy: 25,
          upperBoundTolerance: 50,
        },
        decimals: 3,
      })

      const result = await getNav(
        defaultParams.ea,
        defaultParams.eaInput,
        defaultParams.requester,
        defaultParams.asset,
        defaultParams.registry,
        defaultParams.provider,
      )

      expect(result).toEqual({
        rawNav: '1001',
        adjustedNav: '1001',
        bounds: {
          lowerBound: '993',
          upperBound: '1005',
        },
        bases: {
          lookback: { nav: '1000', ts: now / 1000 - 86400 / 2 },
          previous: { nav: '1000', ts: now / 1000 - 86400 / 2 },
        },
        decimals: 3,
        riskFlag: false,
        breachDirection: '',
        isBounded: true,
      })
    })
  })
})
