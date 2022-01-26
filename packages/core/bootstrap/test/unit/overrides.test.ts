import presetSymbols from '../../src/lib/external-adapter/overrides/presetSymbols.json'

describe('presetSymbols', () => {
  it('Should not contain any overrides that lead to another override', () => {
    for (const adapter in presetSymbols) {
      for (const symbol in presetSymbols[adapter]) {
        const override = presetSymbols[adapter][symbol]
        expect(presetSymbols[adapter][override]).toBeFalsy
      }
    }
  })
})
