import { FTSE100Parser } from '../../../src/parsing/ftse100'
import { expectedFtseData, ftseCsvFixture } from '../../fixtures'

describe('FTSE100Parser', () => {
  let parser: FTSE100Parser

  beforeEach(() => {
    parser = new FTSE100Parser()
  })

  describe('constructor', () => {
    it('should initialize with correct configuration', () => {
      expect(parser).toBeDefined()
    })
  })

  describe('parse', () => {
    it('should parse the actual FTSE CSV file correctly', async () => {
      const result = await parser.parse(ftseCsvFixture)
      expect(result).toBeDefined()
      expect(result).toEqual(expectedFtseData)
    })
    it('should throw error for invalid CSV format', async () => {
      const invalidContent = 'Invalid CSV content without proper headers'

      await expect(parser.parse(invalidContent)).rejects.toThrow('No FTSE 100 index record found')
    })

    it('should throw error when Index Code header is not found', async () => {
      const invalidContent = `26/08/2025 (C) FTSE International Limited 2025. All Rights Reserved
FTSE UK All-Share Indices Valuation Service

Wrong Header,Some Column
UKX,Some Value`

      await expect(parser.parse(invalidContent)).rejects.toThrow('No FTSE 100 index record found')
    })

    it('should throw error when null values are found in required columns', async () => {
      const csvWithNullValues = `02/09/2025 (C) FTSE International Limited 2025. All Rights Reserved
FTSE UK All-Share Indices Valuation Service

Index Code,Index/Sector Name,Number of Constituents,Index Base Currency,USD Index,GBP Index,EUR Index
UKX,FTSE 100 Index,,GBP,4659.89,,4523.90`

      await expect(parser.parse(csvWithNullValues)).rejects.toThrow(
        'Empty or null values found in required columns: Number of Constituents, GBP Index',
      )
    })

    it('should throw error when no FTSE 100 index record is found', async () => {
      const csvWithoutUKX = `02/09/2025 (C) FTSE International Limited 2025. All Rights Reserved
FTSE UK All-Share Indices Valuation Service

Index Code,Index/Sector Name,Number of Constituents,Index Base Currency,USD Index,GBP Index,EUR Index
AS0,FTSE All-Small Index,234,GBP,4535.81973790,4918.68240124,4401.18006784`

      await expect(parser.parse(csvWithoutUKX)).rejects.toThrow('No FTSE 100 index record found')
    })

    it('should throw error when multiple FTSE 100 index records are found', async () => {
      const csvWithDuplicateUKX = `02/09/2025 (C) FTSE International Limited 2025. All Rights Reserved
FTSE UK All-Share Indices Valuation Service

Index Code,Index/Sector Name,Number of Constituents,Index Base Currency,USD Index,GBP Index,EUR Index
UKX,FTSE 100 Index,100,GBP,4659.89,4926.97,4523.90
UKX,FTSE 100 Index (Duplicate),100,GBP,4659.89,5017.25,4523.90`

      await expect(parser.parse(csvWithDuplicateUKX)).rejects.toThrow(
        'Multiple FTSE 100 index records found, expected only one',
      )
    })
  })
})
