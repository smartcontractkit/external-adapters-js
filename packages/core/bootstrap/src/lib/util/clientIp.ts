const ipRegex: Record<string, RegExp> = {
  ipv4: /^(?:(?:\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])\.){3}(?:\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])$/,
  ipv6: /^((?=.*::)(?!.*::.+::)(::)?([\dA-F]{1,4}:(:|\b)|){5}|([\dA-F]{1,4}:){6})((([\dA-F]{1,4}((?!\3)::|:\b|$))|(?!\2\3)){2}|(((2[0-4]|1\d|[1-9])?\d|25[0-5])\.?\b){4})$/i,
}

export const isIp = (str: string | null | undefined): boolean =>
  !!str && (ipRegex.ipv4.test(str) || ipRegex.ipv6.test(str))

function getClientIpFromXForwardedFor(value: unknown) {
  if (!value) return null
  if (typeof value !== 'string') throw new TypeError(`Expected a string, got ${typeof value}`)

  // x-forwarded-for may return multiple IP addresses in the format: "client IP, proxy 1 IP, proxy 2 IP"
  // So the right-most IP address is the IP address of the most recent proxy and the left-most IP address is the IP address of the originating client.
  // Azure Web App's also adds a port for some reason, so only use the first part (the IP)
  // http://docs.aws.amazon.com/elasticloadbalancing/latest/classic/x-forwarded-headers.html
  const forwardedIps = value.split(',').map((e) => {
    const ip = e.trim()
    if (ip.includes(':')) {
      const splitIp = ip.split(':') // only use this if it's ipv4 (ip:port)
      if (splitIp.length === 2) return splitIp[0]
    }
    return ip
  })

  // Sometimes IP addresses in this header can be 'unknown' (http://stackoverflow.com/a/11285650), so take the left-most IP address that is not unknown
  return forwardedIps.find((ip: string) => isIp(ip))
}

/**
 * Get client IP address.
 *
 * @param req
 * @returns {string} ip - The IP address if known, defaulting to 'unknown'.
 */
export function getClientIp(req: any): string {
  if (req.headers) {
    if (isIp(req.headers['x-client-ip'])) return req.headers['x-client-ip'] // Standard headers used by Amazon EC2, Heroku, and others.
    const xForwardedFor = getClientIpFromXForwardedFor(req.headers['x-forwarded-for']) // Load-balancers (AWS ELB) or proxies.
    if (isIp(xForwardedFor)) return String(xForwardedFor)
    if (isIp(req.headers['cf-connecting-ip'])) return req.headers['cf-connecting-ip'] // Cloudflare.
    if (isIp(req.headers['fastly-client-ip'])) return req.headers['fastly-client-ip'] // Fastly and Firebase hosting header
    if (isIp(req.headers['true-client-ip'])) return req.headers['true-client-ip'] // Akamai and Cloudflare: True-Client-IP.
    if (isIp(req.headers['x-real-ip'])) return req.headers['x-real-ip'] // Default nginx proxy/fcgi; alternative to x-forwarded-for, used by some proxies.
    if (isIp(req.headers['x-cluster-client-ip'])) return req.headers['x-cluster-client-ip'] // Rackspace LB and Riverbed's Stingray
    if (isIp(req.headers['x-forwarded'])) return req.headers['x-forwarded']
    if (isIp(req.headers['forwarded-for'])) return req.headers['forwarded-for']
    if (isIp(req.headers.forwarded)) return req.headers.forwarded
  }

  // Remote address checks
  if (req.connection) {
    if (isIp(req.connection.remoteAddress)) return req.connection.remoteAddress
    if (req.connection.socket && isIp(req.connection.socket.remoteAddress))
      return req.connection.socket.remoteAddress
  }

  if (req.socket && isIp(req.socket.remoteAddress)) return req.socket.remoteAddress
  if (req.info && isIp(req.info.remoteAddress)) return req.info.remoteAddress

  // AWS Api Gateway + Lambda
  if (
    req.requestContext &&
    req.requestContext.identity &&
    isIp(req.requestContext.identity.sourceIp)
  )
    return req.requestContext.identity.sourceIp

  return 'unknown'
}
