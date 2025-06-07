# Changelog

## [Unreleased]

### Added

- `changelog new` outputs new CHANGELOG.md to console

## [v0.0.3] - 2025-06-04

### Fixed

- rollover writes local date instead of utc
- support github links in version headers

## [v0.0.2] - 2025-05-24

### Fixed

- prevent arg parsing infinite loop when running executable script

## [v0.0.1] - 2025-05-24

### Added

- `changelog check` exits with error if CHANGELOG.md is missing an unreleased section with release notes
- `changelog get VERSION` retrieves release notes for `VERSION`
- `changelog rollover NEXT_VERSION` creates a new unreleased section and relabels unreleased changes with `NEXT_VERSION`

[Unreleased]: https://github.com/eighty4/changelog/compare/v0.0.3...HEAD
[v0.0.3]: https://github.com/eighty4/changelog/compare/v0.0.2...v0.0.3
[v0.0.2]: https://github.com/eighty4/changelog/compare/v0.0.1...v0.0.2
[v0.0.1]: https://github.com/eighty4/changelog/releases/tag/v0.0.1
