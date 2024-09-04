import { parseRec } from '../../src'

describe('parseRec', () => {
  it('invalid symbols return null', () => {
    expect(parseRec('')).toEqual(null)
    expect(parseRec('FXSPTUSDAEDSPT:GBL.BIL.QTE.RTM')).toEqual(null)
    expect(parseRec('FXSPTUSDAEDSPT!IC')).toEqual(null)
    expect(parseRec('FXSPTUSDAEDSPT')).toEqual(null)
  })

  it('parses a forex spot symbol', () => {
    expect(parseRec('FXSPTUSDAEDSPT:GBL.BIL.QTE.RTM!IC')).toEqual({
      market: 'FXSPT',
      base: 'USD',
      quote: 'AED',
      source: 'GBL',
      stream: 'IC',
    })
  })

  it('parses a metals spot symbol', () => {
    expect(parseRec('CESPTUSDXPTSPT:GBL.BIL.QTE.RTM!TP')).toEqual({
      market: 'CESPT',
      base: 'USD',
      quote: 'XPT',
      source: 'GBL',
      stream: 'TP',
    })
  })

  it('parses a metals forward symbol', () => {
    expect(parseRec('CEFWDXAUUSDSPT06M:LDN.BIL.QTE.RTM!TP')).toEqual({
      market: 'CEFWD',
      base: 'XAU',
      quote: 'USD',
      source: 'LDN',
      stream: 'TP',
    })
  })

  it('parses an overridden symbol', () => {
    expect(parseRec('CEOILOTRWTSBOM:LDN.BIL.QTE.RTM!TP')).toEqual({
      market: 'CEOIL',
      base: 'WTI',
      quote: 'USD',
      source: 'LDN',
      stream: 'TP',
    })
  })
})
