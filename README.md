# changelog

CICD tasks for CHANGELOG.md.

Read about changelogs on [keepachangelog.com](https://keepachangelog.com/en/1.1.0/).

## Installing

```bash
npm i -g @eighty4/changelog
```

## CICD tasks

```bash
# exit 1 if section `## Unreleased` is empty
changelog check [--changelog-file CHANGELOG_FILE]

# get content in section `## $VERSION`
changelog get VERSION [--changelog-file CHANGELOG_FILE]

# move `## Unreleased` content to `## $NEXT_VERSION`
changelog rollover NEXT_VERSION [--changelog-file CHANGELOG_FILE]
```
