export class MockSftpClient {
  constructor() {
    // Mock constructor
  }

  // Basic SFTP Client methods needed for the interface
  async connect(_config: unknown): Promise<void> {
    // Mock connect method
  }

  async end(): Promise<void> {
    // Mock end method
  }

  async get(_remotePath: string): Promise<Buffer> {
    // Mock get method
    return Buffer.from('', 'utf8')
  }

  async list(_remotePath: string): Promise<unknown[]> {
    // Mock list method
    return []
  }
}

// Jest mock for ssh2-sftp-client
export default jest.fn().mockImplementation(() => new MockSftpClient())
