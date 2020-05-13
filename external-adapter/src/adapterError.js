class AdapterError extends Error {
  constructor (message) {
    super(message)
    this.name = 'AdapterError'
    this.message = message
  }

  toJSON () {
    return {
      error: {
        name: this.name,
        message: this.message
      }
    }
  }
}

exports.AdapterError = AdapterError
