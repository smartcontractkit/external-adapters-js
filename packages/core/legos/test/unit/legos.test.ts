describe('legos test', () => {
  //METRICS_ENABLED must be false for unit tests to pass due to metric collisions between v2 and the framework
  const metricsEnabledOrig = process.env['METRICS_ENABLED']
  process.env['METRICS_ENABLED'] = 'false'
  let legos: any
  beforeAll(async () => {
    legos = await import('../../src')
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
