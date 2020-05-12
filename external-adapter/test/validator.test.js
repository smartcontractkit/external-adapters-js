const { assert } = require('chai')
const { Validator } = require('../src/validator')

describe('Validator', () => {
  let called = false

  beforeEach(() => {
    called = false
  })

  // If the callback gets called by the Validator, that
  // means an error occurred
  const callback = (statusCode, data) => {
    called = true
    return () => {
      assert.equal(statusCode, 500)
      assert.equal(data.status, 'errored')
    }
  }

  describe('without required params', () => {
    const params = {
      endpoint: false
    }

    it('errors if no input data is supplied', () => {
      const validator = new Validator(callback, {}, params)
      assert.equal(validator.validated.id, '1')
      assert.isEmpty(validator.validated.data)
      assert.isTrue(called)
    })

    it('does not error if optional params are included', () => {
      const input = {
        id: 'abc123',
        data: {
          endpoint: 'test'
        }
      }

      const validator = new Validator(callback, input, params)
      assert.equal(validator.validated.id, input.id)
      assert.equal(validator.validated.data.endpoint, input.data.endpoint)
      assert.isFalse(called)
    })

    it('does not error if input data is excluded', () => {
      const input = {
        id: 'abc123'
      }

      const validator = new Validator(callback, input)
      assert.equal(validator.validated.id, input.id)
      assert.isFalse(called)
    })

    it('does not error if input data and params are excluded', () => {
      const validator = new Validator(callback)
      assert.equal(validator.validated.id, '1')
      assert.isFalse(called)
    })
  })

  describe('with required params', () => {
    const params = {
      keys: ['one', 'two'],
      endpoint: true
    }

    it('errors if no input is provided', () => {
      const validator = new Validator(callback, {}, params)
      assert.equal(validator.validated.id, '1')
      assert.isEmpty(validator.validated.data)
      assert.isTrue(called)
    })

    it('errors if an array param is not provided', () => {
      const input = {
        id: 'abc123',
        data: {
          endpoint: 'test'
        }
      }

      const validator = new Validator(callback, input, params)
      assert.equal(validator.validated.id, input.id)
      assert.isEmpty(validator.validated.data)
      assert.isTrue(called)
    })

    it('errors if a boolean param is not provided', () => {
      const input = {
        id: 'abc123',
        data: {
          one: 'test'
        }
      }

      const validator = new Validator(callback, input, params)
      assert.equal(validator.validated.id, input.id)
      assert.isTrue(called)
    })

    it('does not error if required params are included', () => {
      const input = {
        id: 'abc123',
        data: {
          endpoint: 'test',
          one: 'test'
        }
      }

      const validator = new Validator(callback, input, params)
      assert.equal(validator.validated.id, input.id)
      assert.equal(validator.validated.data.endpoint, input.data.endpoint)
      assert.equal(validator.validated.data.keys, input.data.one)
      assert.isFalse(called)
    })
  })

  it('accepts input without customParams', () => {
    const input = {
      id: 'abc123',
      data: {
        endpoint: 'test',
        one: 'test'
      }
    }
    const validator = new Validator(callback, input)
    assert.equal(validator.validated.id, input.id)
    assert.isFalse(called)
  })
})
