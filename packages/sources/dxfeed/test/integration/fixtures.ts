/**
 * The legacy cometd-era fixture that stood here (mocked `/service/data` frames
 * against the real provider REST host) is deleted with the cometd transport it
 * served — the migration's deletion exception (OPDATA-9200,
 * cometd-transport-deletion) leaves no cometd behavior to mock.
 *
 * Nothing imports this module. The dxLink migration's test doubles live in:
 * - ./dxlink-mocks.ts — the dxLink mock server (handshake, FEED_SUBSCRIPTION
 *   drives FEED_DATA, handshake-failure modes), fake loopback hosts only
 * - ./rest-mocks.ts — the batched REST transport mock, fake host only
 *
 * Plan round1-test-fake-urls / verifier feedback test_fake_urls: no real
 * provider hostname may appear in any file under test/ — provider hosts live
 * only in the src/config defaults.
 */
export {}
