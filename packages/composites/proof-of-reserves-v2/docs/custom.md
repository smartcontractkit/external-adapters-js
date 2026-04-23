## Variable env vars

Several parameters in the request refer to a `provider`. This is a string that
identifies the data provider to use for that parameter. To support a
specific value for the `provider` parameter, the environment variable
`<PROVIDER>_URL` must be set, where `<PROVIDER>` is the
upper-snake-case version of the value provided for the `provider` parameter.

For example, if there is an address list with `"provider": "por-address-list"`,
then `POR_ADDRESS_LIST_URL` must be set to the URL of the `por-address-list`
adapter.
