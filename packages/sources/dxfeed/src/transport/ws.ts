/**
 * dxLink websocket transport — a CONFIGURATION of the framework's
 * WebSocketTransport hooks only (spec framework_alignment mechanism
 * "template transport-ws-subscribe"): Basic auth on the handshake via
 * options(), the dxLink open gate in handlers.open, the KEEPALIVE frame in
 * handlers.heartbeat, COMPACT FEED_DATA fan-out in handlers.message and the
 * FEED_SUBSCRIPTION add/remove arrays in customSubscriptionMessages. All
 * dxLink protocol mechanics (handshake messages, open gate, COMPACT parsing,
 * per-wire-key fan-out) live in the provider protocol library at
 * ../dxlink/protocol (spec exception dxlink-control-protocol) — this module
 * carries no protocol logic, manual listeners or timers.
 *
 * Re-exports the protocol library's API for the adapter's tests and endpoints.
 */
export * from '../dxlink/protocol'

import { TransportGenerics } from '@chainlink/external-adapter-framework/transports'
import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports/websocket'
import { ProviderResult } from '@chainlink/external-adapter-framework/util'
import { config } from '../config'
import * as dxlink from '../dxlink/protocol'

// The hook wiring below substitutes the template's open-handler extension
// point with the dxLink handshake gate, KEEPALIVE frame, COMPACT fan-out and
// FEED_SUBSCRIPTION builders (spec exception dxlink-control-protocol); the
// Basic handshake header at options() is the basic-auth-not-oauth exception.
// TEMPLATE-EXTENSION: open-handler
type BaseTransportTypes = {
  Parameters: TransportGenerics['Parameters']
  Response: TransportGenerics['Response']
  Settings: TransportGenerics['Settings'] & typeof config.settings
}

export function buildDxLinkWsTransport<T extends BaseTransportTypes>(
  deps: dxlink.DxLinkFeedDeps<T & dxlink.DxLinkProviderTypes>,
): WebSocketTransport<T & dxlink.DxLinkProviderTypes> {
  const feed = new dxlink.DxLinkFeed<T & dxlink.DxLinkProviderTypes>(deps)

  return new WebSocketTransport<T & dxlink.DxLinkProviderTypes>({
    url: (context) => context.adapterSettings.WS_API_ENDPOINT || '',

    options: (context) => dxlink.dxLinkConnectionOptions(context.adapterSettings),

    handlers: {
      open: async (connection, context) => {
        await dxlink.openDxLinkConnection(
          connection,
          (fields) => feed.onFeedConfig(fields),
          context.adapterSettings.WS_CONNECTION_OPEN_TIMEOUT,
        )
      },

      heartbeat: (connection) => {
        connection.send(JSON.stringify(dxlink.dxLinkKeepaliveMessage()))
      },

      message: (message) =>
        feed
          .message(message)
          .map(
            ({ params, ...response }) =>
              ({ params, response } as ProviderResult<T & dxlink.DxLinkProviderTypes>),
          ),
    },

    builders: {
      customSubscriptionMessages: (_context, subscriptions) =>
        feed.subscriptionMessages(subscriptions),
    },
  })
}
// END TEMPLATE-EXTENSION
