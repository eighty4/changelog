export function checkUnreleased(changelogContent: string): boolean {
    if (typeof changelogContent !== 'string' || !changelogContent.length) {
        throw new TypeError('input must be a string')
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
