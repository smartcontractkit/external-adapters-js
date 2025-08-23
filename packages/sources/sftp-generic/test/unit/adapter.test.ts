import { adapter } from '../../src'

describe('SFTP Generic Adapter', () => {
  describe('adapter configuration', () => {
    it('should be properly configured', () => {
      expect(adapter).toBeDefined()
      expect(adapter.name).toBe('SFTP_GENERIC')
      expect(adapter.defaultEndpoint).toBe('sftp')
    })

    it('should have the correct endpoints', () => {
      expect(adapter.endpoints).toHaveLength(1)
      expect(adapter.endpoints[0]).toBeDefined()
    })

    it('should have config defined', () => {
      expect(adapter.config).toBeDefined()
    })
  })

  describe('server function', () => {
    it('should export server function', async () => {
      const { server } = await import('../../src')
      expect(typeof server).toBe('function')
    })
  })
})
