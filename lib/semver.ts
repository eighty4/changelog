export function isSemverVersion(v: string): boolean {
    return /v\d+\.\d+\.\d+/.test(v)
}
