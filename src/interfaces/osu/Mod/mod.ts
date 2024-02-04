export interface Mod {
    acronym: string;
}

export function convertModsToStrings(mods: Mod[]): string[] {
    return mods.map(mod => mod.acronym);
}

export function stringToModArray(mods: string[]): Mod[] {
    return mods.map(mod => {
        const parsed: Mod = {
            acronym: mod,
        }

        return parsed;
    })
}
