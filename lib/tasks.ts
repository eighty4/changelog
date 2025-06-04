function isSemverVersion(v: string): boolean {
    return /v\d+\.\d+\.\d+/.test(v)
}

export function checkUnreleased(changelogContent: string): boolean {
    if (typeof changelogContent !== 'string' || !changelogContent.length) {
        throw new Error('input must be a string')
    }
    const notes = /## \[Unreleased\](?<notes>[\s\S]+?)(?=\s+(## |\[))/
        .exec(changelogContent)
        ?.groups?.notes?.trim()
    if (!notes?.length) {
        return false
    }
    return (
        notes.split(/\r?\n/).filter(l => {
            if (l.startsWith('### ')) {
                return false
            }
            l = l.trim()
            return l.length && l !== '- ???'
        }).length > 0
    )
}

export function getVersionContent(
    changelogContent: string,
    version: string,
): string {
    if (version !== 'Unreleased' && !isSemverVersion(version)) {
        throw new Error(
            version +
                ' is not a `vX.X.X` format semver or the `Unreleased` label',
        )
    }
    const versionStartStr = `## [${version}]`
    const versionStart = changelogContent.indexOf(versionStartStr)
    if (versionStart === -1) {
        throw new Error(version + ' not found in changelog file')
    }
    const notesStart = changelogContent.indexOf('\n', versionStart)
    let notesEnd = changelogContent.indexOf('\n## ', notesStart)
    if (notesEnd === -1) {
        notesEnd = changelogContent.indexOf('[', notesStart)
    }
    if (notesEnd === -1) {
        notesEnd = changelogContent.length
    }
    const notes = changelogContent.substring(notesStart, notesEnd).trim()
    if (!notes.length) {
        return ''
    }
    let result = ''
    let categoryLines: Array<string> = []
    for (const l of notes.split(/\r?\n/).map(l => l.trim())) {
        if (version === 'Unreleased' && l === '- ???') {
            continue
        }
        if (l.startsWith('### ')) {
            if (categoryLines.some(l => l.startsWith('-'))) {
                result += categoryLines.join('\n')
            }
            categoryLines = []
        }
        categoryLines.push(l)
    }
    if (categoryLines.some(l => l.startsWith('-'))) {
        result += categoryLines.join('\n')
    }
    return result
}

export function getRolloverResult(
    changelogContent: string,
    version: string,
): string {
    if (!isSemverVersion(version)) {
        throw new Error(version + ' is not a `vX.X.X` format semver')
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
