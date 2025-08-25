export class MockSftpClient {
  private isConnected = false
  private files: Record<string, string> = {}
  private shouldFailConnection = false
  private shouldFailFileOperation = false
  private connectionTimeout = false

  constructor() {
    // Reset state for each new instance
    this.isConnected = false
    this.files = {}
    this.shouldFailConnection = false
    this.shouldFailFileOperation = false
    this.connectionTimeout = false
  }

  // Test control methods
  setFiles(files: Record<string, string>): void {
    this.files = files
  }

  setShouldFailConnection(fail: boolean): void {
    this.shouldFailConnection = fail
  }

  setShouldFailFileOperation(fail: boolean): void {
    this.shouldFailFileOperation = fail
  }

  setConnectionTimeout(timeout: boolean): void {
    this.connectionTimeout = timeout
  }

  // SFTP Client methods
  async connect(_config: any): Promise<void> {
    if (this.connectionTimeout) {
      // Simulate connection timeout
      await new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout')), 100)
      })
    }

    if (this.shouldFailConnection) {
      throw new Error('Connection failed')
    }

    this.isConnected = true
  }

  async end(): Promise<void> {
    this.isConnected = false
  }

  async get(remotePath: string): Promise<Buffer> {
    if (!this.isConnected) {
      throw new Error('Not connected')
    }

    if (this.shouldFailFileOperation) {
      throw new Error('File operation failed')
    }

    const content = this.files[remotePath]
    if (content === undefined) {
      throw new Error(`File not found: ${remotePath}`)
    }

    return Buffer.from(content, 'utf8')
  }

  async list(remotePath: string): Promise<any[]> {
    if (!this.isConnected) {
      throw new Error('Not connected')
    }

    if (this.shouldFailFileOperation) {
      throw new Error('List operation failed')
    }

    const files = Object.keys(this.files)
      .filter(path => path.startsWith(remotePath))
      .map(path => ({
        name: path.split('/').pop(),
        type: '-',
        size: this.files[path].length,
        modifyTime: Date.now(),
      }))

    return files
  }

  // Helper method to check connection status
  isConnectionActive(): boolean {
    return this.isConnected
  }
}

// Global mock instance for jest mocking
export const mockSftpClientInstance = new MockSftpClient()

// Jest mock for ssh2-sftp-client
export default jest.fn().mockImplementation(() => mockSftpClientInstance)
