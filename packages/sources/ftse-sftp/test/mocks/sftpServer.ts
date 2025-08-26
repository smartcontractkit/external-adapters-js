import { EventEmitter } from 'events'

export interface MockSftpConfig {
  host: string
  port: number
  username: string
  password: string
}

export class MockSftpServer extends EventEmitter {
  private config: MockSftpConfig
  private files: Record<string, string> = {}
  private isListening = false

  constructor(config: MockSftpConfig) {
    super()
    this.config = config
  }

  setFiles(files: Record<string, string>): void {
    this.files = files
  }

  addFile(path: string, content: string): void {
    this.files[path] = content
  }

  getFile(path: string): string | undefined {
    return this.files[path]
  }

  hasFile(path: string): boolean {
    return path in this.files
  }

  async start(): Promise<void> {
    if (this.isListening) {
      return
    }
    this.isListening = true
    this.emit('ready')
  }

  async stop(): Promise<void> {
    if (!this.isListening) {
      return
    }
    this.isListening = false
    this.emit('close')
  }

  getConfig(): MockSftpConfig {
    return { ...this.config }
  }

  isRunning(): boolean {
    return this.isListening
  }
}
