import { getEnv, buildUrlPath } from '../../src/lib/util'

describe('utils', () => {
  let oldEnv

  beforeEach(() => {
    oldEnv = process.env
  })

  afterEach(() => {
    process.env = oldEnv
  })

  describe('getRequiredEnv', () => {
    it('fetches the correct environment variable', () => {
      process.env.TEST = 'test'
      const actual = getEnv('TEST')
      expect(actual).toEqual('test')
    })

    it('ignores empty string environment variables', () => {
      process.env.TEST = ''
      const actual = getEnv('TEST')
      expect(actual).toBeUndefined()
    })
  })

  describe(`buildUrlPath`, () => {
    it(`builds path with valid characters`, () => {
      const actual = buildUrlPath('/from/:from/to/:to', {
        from: 'ETH',
        to: 'USD',
        message: 'hello_world',
      })
      expect(actual).toEqual('/from/ETH/to/USD?message=hello_world')
    })

    it(`builds path from empty string`, () => {
      const actual = buildUrlPath('', { from: 'ETH', to: 'USD', message: 'hello_world' })
      expect(actual).toEqual('?from=ETH&to=USD&message=hello_world')
    })

    it(`builds path with no params`, () => {
      const actual = buildUrlPath('/from/to')
      expect(actual).toEqual('/from/to')
    })

    it(`builds path with reserved characters`, () => {
      const actual = buildUrlPath('/from/:from/to/:to', {
        from: 'ETH:USD',
        to: 'USD/?ETH=USD',
        message: 'hello;+world',
      })
      expect(actual).toEqual('/from/ETH%3AUSD/to/USD%2F%3FETH%3DUSD?message=hello%3B%2Bworld')
    })

    it(`builds path with unsafe characters`, () => {
      const actual = buildUrlPath('/from/:from/to/:to', {
        from: 'ETH"USD"',
        to: '{U|S|D>',
        message: 'hello world',
      })
      expect(actual).toEqual('/from/ETH%22USD%22/to/%7BU%7CS%7CD%3E?message=hello+world')
      expect(decodeURI(actual)).toEqual('/from/ETH"USD"/to/{U|S|D>?message=hello+world')
    })

    it(`builds path with non-latin characters`, () => {
      const actual = buildUrlPath('/from/:from/to/:to', {
        from: 'abcÂÃ',
        to: 'доллар_США',
        message: '你好世界',
      })
      expect(actual).toEqual(
        '/from/abc%C3%82%C3%83/to/%D0%B4%D0%BE%D0%BB%D0%BB%D0%B0%D1%80_%D0%A1%D0%A8%D0%90?message=%E4%BD%A0%E5%A5%BD%E4%B8%96%E7%95%8C',
      )
      expect(decodeURI(actual)).toEqual('/from/abcÂÃ/to/доллар_США?message=你好世界')
    })
  })
})
