## Known Issues

`solana-functions` does not provide a direct way to call view functions on
Solana programs because there is no standard way in Solana to call view
functions.

In Solana, accounts have account data that can be read. But the meaning of this
account data depends on the program that created it. There is not a single
standard way to interpret the account data. Some ways are using an Anchor IDL
or defining a buffer layout but even with those, you need to know the specific
format for the program you are using.

This means that supporting a new program, always requires a code change in the
external adapter and does not work out of the box.

If a program uses Anchor, you might be able to download the IDL from its page
on explorer.solana.com. In this case note that IDLs created with an Anchor
version of 0.29.0 or earlier are not compatible with anchor 0.30.0 or later.
