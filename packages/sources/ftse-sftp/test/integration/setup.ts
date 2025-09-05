// Integration test setup file
import 'jest'

// Set up global test environment
process.env.NODE_ENV = 'test'

// Suppress console warnings during tests
const originalWarn = console.warn
const originalError = console.error

beforeAll(() => {
  console.warn = jest.fn()
  console.error = jest.fn()
})

afterAll(() => {
  console.warn = originalWarn
  console.error = originalError
})

// Global test timeout
jest.setTimeout(30000)
