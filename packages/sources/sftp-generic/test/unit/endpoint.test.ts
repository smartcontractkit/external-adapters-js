import { inputParameters, indiceToFileMap } from '../../src/endpoint/sftp'

describe('SFTP Endpoint Configuration', () => {
  describe('inputParameters', () => {
    it('should have correct parameter definitions', () => {
      const params = inputParameters.definition
      
      expect(params.operation).toBeDefined()
      expect(params.operation.required).toBe(true)
      expect(params.operation.type).toBe('string')
      expect(params.operation.options).toEqual(['download'])
      
      expect(params.remotePath).toBeDefined()
      expect(params.remotePath.required).toBe(true)
      expect(params.remotePath.type).toBe('string')
      
      expect(params.instrument).toBeDefined()
      expect(params.instrument.required).toBe(true)
      expect(params.instrument.type).toBe('string')
    })

    it('should have correct example data', () => {
      const examples = inputParameters.examples
      expect(examples).toHaveLength(1)
      if (examples && examples.length > 0) {
        expect(examples[0]).toEqual({
          operation: 'download',
          remotePath: '/data',
          instrument: 'FTSE100INDEX',
        })
      }
    })
  })

  describe('indiceToFileMap', () => {
    it('should contain all supported instruments', () => {
      const expectedInstruments = [
        'FTSE100INDEX',
        'Russell1000INDEX',
        'Russell2000INDEX',
        'Russell3000INDEX',
      ]
      
      expectedInstruments.forEach(instrument => {
        expect(indiceToFileMap).toHaveProperty(instrument)
      })
    })

    it('should have correct file patterns for each instrument', () => {
      expect(indiceToFileMap.FTSE100INDEX).toBe('vall{{dd}}{{mm}}.csv')
      expect(indiceToFileMap.Russell1000INDEX).toBe('daily_values_russell_{{dd}}{{mm}}.csv')
      expect(indiceToFileMap.Russell2000INDEX).toBe('daily_values_russell_{{dd}}{{mm}}.csv')
      expect(indiceToFileMap.Russell3000INDEX).toBe('daily_values_russell_{{dd}}{{mm}}.csv')
    })

    it('should use template placeholders for date formatting', () => {
      Object.values(indiceToFileMap).forEach(pattern => {
        expect(pattern).toContain('{{dd}}')
        expect(pattern).toContain('{{mm}}')
        expect(pattern).toContain('.csv')
      })
    })

    it('should have unique patterns or be intentionally shared', () => {
      const patterns = Object.values(indiceToFileMap)
      const uniquePatterns = [...new Set(patterns)]
      
      // Russell indices intentionally share the same pattern
      expect(patterns).toHaveLength(4)
      expect(uniquePatterns).toHaveLength(2) // FTSE has unique pattern, Russell indices share one
    })

    it('should contain only string values', () => {
      Object.values(indiceToFileMap).forEach(pattern => {
        expect(typeof pattern).toBe('string')
        expect(pattern.length).toBeGreaterThan(0)
      })
    })

    it('should have CSV file extensions', () => {
      Object.values(indiceToFileMap).forEach(pattern => {
        expect(pattern).toMatch(/\.csv$/)
      })
    })
  })

  describe('supported instruments', () => {
    it('should support FTSE100INDEX', () => {
      expect(indiceToFileMap.FTSE100INDEX).toBeDefined()
    })

    it('should support Russell1000INDEX', () => {
      expect(indiceToFileMap.Russell1000INDEX).toBeDefined()
    })

    it('should support Russell2000INDEX', () => {
      expect(indiceToFileMap.Russell2000INDEX).toBeDefined()
    })

    it('should support Russell3000INDEX', () => {
      expect(indiceToFileMap.Russell3000INDEX).toBeDefined()
    })
  })

  describe('file pattern templates', () => {
    it('should have correct FTSE pattern structure', () => {
      const pattern = indiceToFileMap.FTSE100INDEX
      expect(pattern).toMatch(/^vall\{\{dd\}\}\{\{mm\}\}\.csv$/)
    })

    it('should have correct Russell pattern structure', () => {
      const russellPattern = /^daily_values_russell_\{\{dd\}\}\{\{mm\}\}\.csv$/
      expect(indiceToFileMap.Russell1000INDEX).toMatch(russellPattern)
      expect(indiceToFileMap.Russell2000INDEX).toMatch(russellPattern)
      expect(indiceToFileMap.Russell3000INDEX).toMatch(russellPattern)
    })
  })
})
