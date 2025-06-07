import { isSemverVersion } from './semver.ts'

export function getRolloverResult(
    changelogContent: string,
    version: string,
): string {
    if (typeof changelogContent !== 'string' || !changelogContent.length) {
        throw new TypeError('input must be a string')
    }
    if (!isSemverVersion(version)) {
        throw new TypeError(version + ' is not a `vX.X.X` format semver')
    }
    const unreleasedLinkRegex = /^.*\[Unreleased\]:\s+?(?<url>.*)$/m
    const githubUrlRegex =
        /^https:\/\/github\.com\/(?<owner>\S+?)\/(?<name>\S+?)\/(?<path>.*)$/
    const unreleasedLink =
        changelogContent.match(unreleasedLinkRegex)?.groups?.url
    if (!unreleasedLink) {
        throw new Error()
    }
    const unreleasedLinkGithubUrlMatch = unreleasedLink.match(githubUrlRegex)
    if (!unreleasedLinkGithubUrlMatch?.groups) {
        throw new Error()
    }
    const {
        owner,
        name,
        path: unreleasedGitHubUrlPath,
    } = unreleasedLinkGithubUrlMatch.groups

    let result = changelogContent.replace(
        /## \[Unreleased\]/,
        `## [Unreleased]\n\n- ???\n\n## [${version}] - ${getCurrentDate()}`,
    )

    if (
        unreleasedGitHubUrlPath.startsWith('compare/') &&
        unreleasedGitHubUrlPath.endsWith('...HEAD')
    ) {
        return result
            .replace(/\.\.\.HEAD/, `...${version}`)
            .replace(
                /\[Unreleased\]:/,
                `[Unreleased]: https://github.com/${owner}/${name}/compare/${version}...HEAD\n[${version}]:`,
            )
    } else {
        const next = `[Unreleased]: https://github.com/${owner}/${name}/compare/${version}...HEAD`
        const previous = `[${version}]: https://github.com/${owner}/${name}/releases/tag/${version}`
        return result.replace(unreleasedLinkRegex, next + '\n' + previous)
    }
}

export function getCurrentDate(): string {
    const now = new Date()
    const offset = now.getTimezoneOffset()
    const local = new Date(now.getTime() - offset * 60 * 1000)
    return `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, '0')}-${String(local.getDate()).padStart(2, '0')}`
}
