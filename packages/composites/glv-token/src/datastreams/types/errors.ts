/**
 * Base error class for all Data Streams SDK errors.
 *
 * All SDK-specific errors inherit from this class, enabling easy error type detection
 * and unified error handling across the entire SDK.
 */
export class DataStreamsError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DataStreamsError'
    Object.setPrototypeOf(this, DataStreamsError.prototype)
  }
}

/**
 * Thrown when input validation fails.
 *
 * Common scenarios include invalid feed IDs, empty required parameters,
 * invalid configuration values, or malformed timestamp values.
 */
export class ValidationError extends DataStreamsError {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
    Object.setPrototypeOf(this, ValidationError.prototype)
  }
}

/**
 * Thrown when authentication with Data Streams API fails.
 *
 * Common scenarios include invalid credentials, malformed HMAC signature,
 * expired tokens, or missing authentication headers.
 */
export class AuthenticationError extends DataStreamsError {
  constructor(message: string) {
    super(message)
    this.name = 'AuthenticationError'
    Object.setPrototypeOf(this, AuthenticationError.prototype)
  }
}

/**
 * Thrown when report data decoding fails.
 *
 * Common scenarios include corrupted report data, unsupported report format version,
 * or invalid report structure.
 */
export class ReportDecodingError extends DataStreamsError {
  constructor(message: string) {
    super(message)
    this.name = 'ReportDecodingError'
    Object.setPrototypeOf(this, ReportDecodingError.prototype)
  }
}

/**
 * Thrown when WebSocket connection establishment or management fails.
 *
 * Common scenarios include network connectivity issues, server unavailability,
 * connection timeouts, or protocol-level errors.
 *
 * Note: In HA mode, individual WebSocket failures may not interrupt the stream
 * if other connections remain active.
 */
export class WebSocketError extends DataStreamsError {
  constructor(message: string) {
    super(message)
    this.name = 'WebSocketError'
    Object.setPrototypeOf(this, WebSocketError.prototype)
  }
}

/**
 * Thrown when REST API requests fail.
 *
 * Common scenarios include HTTP 4xx/5xx errors, network timeouts,
 * rate limiting, or malformed requests.
 *
 * @param statusCode - HTTP status code from the failed request (if available)
 */
export class APIError extends DataStreamsError {
  constructor(message: string, public statusCode?: number) {
    super(message)
    this.name = 'APIError'
    Object.setPrototypeOf(this, APIError.prototype)
  }
}

/**
 * Thrown when automatic origin discovery fails in High Availability mode.
 *
 * This occurs when the client cannot discover additional WebSocket endpoints
 * via HEAD request to the origin server. The stream may fall back to static
 * configuration or single-connection mode.
 *
 * @param cause - The underlying error that caused discovery to fail (if available)
 */
export class OriginDiscoveryError extends DataStreamsError {
  constructor(message: string, public readonly cause?: Error) {
    super(message)
    this.name = 'OriginDiscoveryError'
    Object.setPrototypeOf(this, OriginDiscoveryError.prototype)
  }
}

/**
 * Thrown when all connections fail in High Availability mode.
 *
 * This is a critical error indicating complete failure of the HA connection system.
 * No WebSocket connections could be established to any discovered or configured origins.
 */
export class MultiConnectionError extends DataStreamsError {
  constructor(message: string) {
    super(message)
    this.name = 'MultiConnectionError'
    Object.setPrototypeOf(this, MultiConnectionError.prototype)
  }
}

/**
 * Thrown when some (but not all) connections fail in High Availability mode.
 *
 * This indicates degraded HA performance. The stream continues to operate with
 * successful connections, but redundancy is reduced.
 *
 * @param failedConnections - Number of connections that failed to establish
 * @param totalConnections - Total number of connections attempted
 */
export class PartialConnectionFailureError extends DataStreamsError {
  constructor(
    message: string,
    public readonly failedConnections: number,
    public readonly totalConnections: number,
  ) {
    super(message)
    this.name = 'PartialConnectionFailureError'
    Object.setPrototypeOf(this, PartialConnectionFailureError.prototype)
  }
}

/**
 * Thrown when insufficient connections are available for optimal High Availability mode.
 *
 * This warning-level error indicates that while some connections succeeded, the number
 * is below the threshold for robust HA operation. The stream continues with reduced
 * fault tolerance.
 *
 * @param availableConnections - Number of successful connections established
 * @param requiredConnections - Minimum number of connections desired for full HA
 */
export class InsufficientConnectionsError extends DataStreamsError {
  constructor(
    message: string,
    public readonly availableConnections: number,
    public readonly requiredConnections: number,
  ) {
    super(message)
    this.name = 'InsufficientConnectionsError'
    Object.setPrototypeOf(this, InsufficientConnectionsError.prototype)
  }
}
