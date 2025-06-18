# changelog goldens

This is a place for testing output and error handling of `changelog` with
various GitHub Workflows. Stdout for each test is written to `out.au` and
stderr is written to `err.au` in each test's directory.

Run `update.sh` from this directory or `pnpm test:gold:update` to keep
`out.au` files in sync with code changes.
