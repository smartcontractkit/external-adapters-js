import { FTSE100Parser } from '../../../src/parsing/ftse100'

describe('FTSE100Parser Debug', () => {
  let parser: FTSE100Parser

  beforeEach(() => {
    parser = new FTSE100Parser()
  })

  it('should debug validation with full content', () => {
    const fullContent = `26/08/2025 (C) FTSE International Limited 2025. All Rights Reserved
FTSE UK All-Share Indices Valuation Service

Index Code\tIndex/Sector Name\tNumber of Constituents\tIndex Base Currency\tUSD Index\tGBP Index\tEUR Index
AS0\tFTSE All-Small Index\t234\tGBP\t4659.89\t5017.25\t4523.90`

    console.log('Full content validation result:', parser.validateFormat(fullContent))

    // Let's trace through the base parser's validation
    const lines = fullContent.split(/\r?\n/)
    console.log('All lines:')
    lines.forEach((line, i) => {
      console.log(`${i}: "${line}"`)
    })

    // Test splitIntoLines method that's used in base validation
    const filteredLines = lines.filter((line) => line.trim().length > 0)
    console.log('\nFiltered lines:')
    filteredLines.forEach((line, i) => {
      console.log(`${i}: "${line}"`)
    })

    // Check header detection
    const headerLineIndex = filteredLines.findIndex((line) => line.trim().startsWith('Index Code'))
    console.log('\nHeader line index in filtered lines:', headerLineIndex)

    if (headerLineIndex >= 0) {
      const headerLine = filteredLines[headerLineIndex]
      console.log('Header line:', headerLine)

      const fields = headerLine.split('\t')
      console.log('Fields:', fields)

      const requiredColumns = [
        'Index Code',
        'Index/Sector Name',
        'Number of Constituents',
        'Index Base Currency',
        'GBP Index',
      ]
      const allFound = requiredColumns.every((col) =>
        fields.some((header) => header.toLowerCase().includes(col.toLowerCase())),
      )
      console.log('All required columns found:', allFound)
    }
  })
})
