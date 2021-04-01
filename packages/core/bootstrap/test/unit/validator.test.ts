import { Validator } from '../../src/lib/external-adapter/validator'

describe('Validator', () => {
  describe('without required params', () => {
    const params = {
      endpoint: false,
    }

    it('errors if no input data is supplied', () => {
      const validator = new Validator({}, params)
      expect(validator.validated.id).toEqual('1')
      expect(validator.validated.data).toEqual({})
      expect(validator.error).toBeTruthy()
      expect(validator?.error?.statusCode).toEqual(400)
      expect(validator?.error?.status).toEqual('errored')
    })

    it('does not error if optional params are included', () => {
      const input = {
        id: 'abc123',
        data: {
          endpoint: 'test',
        },
      }

      const validator = new Validator(input, params)
      expect(validator.validated.id).toEqual(input.id)
      expect(validator.validated.data.endpoint).toEqual(input.data.endpoint)
      expect(validator.error).not.toBeDefined()
    })

    it('does not error if input data is excluded', () => {
      const input = {
        id: 'abc123',
      }

      const validator = new Validator(input)
      expect(validator.validated.id).toEqual(input.id)
      expect(validator.error).not.toBeDefined()
    })

    it('does not error if input data and params are excluded', () => {
      const validator = new Validator()
      expect(validator.validated.id).toEqual('1')
      expect(validator.error).not.toBeDefined()
    })
  })

  describe('with required params', () => {
    const params = {
      keys: ['one', 'two'],
      endpoint: true,
    }

    it('errors if no input is provided', () => {
      const validator = new Validator({}, params)
      expect(validator.validated.id).toEqual('1')
      expect(validator.validated.data).toEqual({})
      expect(validator.error).toBeTruthy()
      expect(validator?.error?.statusCode).toEqual(400)
      expect(validator?.error?.status).toEqual('errored')
    })

    it('errors if an array param is not provided', () => {
      const input = {
        id: 'abc123',
        data: {
          endpoint: 'test',
        },
      }

      const validator = new Validator(input, params)
      expect(validator.validated.id).toEqual(input.id)
      expect(validator.validated.data).toEqual({})
      expect(validator?.error).toBeTruthy()
      expect(validator?.error?.statusCode).toEqual(400)
      expect(validator?.error?.status).toEqual('errored')
    })

    it('errors if a boolean param is not provided', () => {
      const input = {
        id: 'abc123',
        data: {
          one: 'test',
        },
      }

      const validator = new Validator(input, params)
      expect(validator.validated.id).toEqual(input.id)
      expect(validator.error).toBeTruthy()
      expect(validator?.error?.statusCode).toEqual(400)
      expect(validator?.error?.status).toEqual('errored')
    })

    it('does not error if required params are included', () => {
      const input = {
        id: 'abc123',
        data: {
          endpoint: 'test',
          one: 'test',
        },
      }

      const validator = new Validator(input, params)
      expect(validator.validated.id).toEqual(input.id)
      expect(validator.validated.data.endpoint).toEqual(input.data.endpoint)
      expect(validator.validated.data.keys).toEqual(input.data.one)
      expect(validator.error).not.toBeDefined()
    })
  })

  it('accepts input without customParams', () => {
    const input = {
      id: 'abc123',
      data: {
        endpoint: 'test',
        one: 'test',
      },
    }
    const validator = new Validator(input)
    expect(validator.validated.id).toEqual(input.id)
    expect(validator.error).not.toBeDefined()
  })

  it('default overrides input is loaded', () => {
    const input = {
      id: '1',
      data: {},
    }
    const validator = new Validator(input)
    assert.isAbove(validator.validated.overrides?.size, 1)
    assert.equal(validator.validated.overrides.get('coingecko').get('uni'), 'uniswap')
  })

  it('overrides input is formatted', () => {
    const input = {
      id: '1',
      data: {
        overrides: {
          coingecko: {
            uni: 'uniswap',
          },
        },
      },
    }
    const validator = new Validator(input)
    assert.equal(validator.validated.overrides.get('coingecko').get('uni'), 'uniswap')
  })

  it('errors if overrides is not properly formatted', () => {
    const input = {
      id: '1',
      data: {
        overrides: {
          uni: 'uniswap',
        },
      },
    }
    const validator = new Validator(input)
    assert.exists(validator.error)
    assert.equal(validator?.error?.statusCode, 400)
    assert.equal(validator?.error?.status, 'errored')
  })
})
