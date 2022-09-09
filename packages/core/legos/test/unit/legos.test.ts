describe('legos test', () => {
  //METRICS_ENABLED musb be false before importing sources, or you will have collisions with duplicate metrics in v2 and framework adapters
  const metricsEnabledOrig = process.env['METRICS_ENABLED']
  process.env['METRICS_ENABLED'] = 'false'
  let legos: any
  beforeAll(async () => {
    legos = await import('../../src') //Use require, since having an import statement appear after code (setting METRICS_ENABLED) looks wrong
  })

  afterAll(() => {
    process.env['METRICS_ENABLED'] = metricsEnabledOrig
  })

  it('has no unnacceptable characters', function () {
    for (const source of legos.default.sources) {
      const pattern = new RegExp(/[~`!#$%^&*+=\-[\]\\';,/{}|\\":<>?]/)
      expect(pattern.test(source)).toBe(false)
    }
  })
  it('doesnt begin with a digit', function () {
    for (const source of legos.default.sources) {
      const isDigit = source.charAt(0) >= '0' && source.charAt(0) <= '9'
      expect(isDigit).toBe(false)
    }
  })
  it('contains only uppercase letters', function () {
    for (const source of legos.default.sources) {
      expect(source.toUpperCase() === source).toBe(true)
    }
  })
})
