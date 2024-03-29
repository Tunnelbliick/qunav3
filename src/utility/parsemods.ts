import { Mod } from "../interfaces/osu/Mod/mod";

const binaries: { [key: number]: string[] } = {
    0: ['None', 'NM'],
    1: ['NoFail', 'NF'],
    2: ['Easy', 'EZ'],
    4: ['TouchDevice', 'TD'],
    8: ['Hidden', 'HD'],
    16: ['HardRock', 'HR'],
    32: ['SuddenDeath', 'SD'],
    64: ['DoubleTime', 'DT'],
    128: ['Relax', 'RX'],
    256: ['HalfTime', 'HT'],
    512: ['Nightcore', 'NC'], // Only set along with DoubleTime. i.e: NC only gives 576
    1024: ['Flashlight', 'FL'],
    2048: ['Autoplay', 'AP'],
    4096: ['SpunOut', 'SO'],
    8192: ['Relax2', 'AP'], // Autopilot
    16384: ['Perfect', 'PF'], // Only set along with SuddenDeath. i.e: PF only gives 16416  
    32768: ['Key4', '4K'],
    65536: ['Key5', '5K'],
    131072: ['Key6', '6K'],
    262144: ['Key7', '7K'],
    524288: ['Key8', '8K'],
    1048576: ['FadeIn', 'FI'],
    2097152: ['Random', 'RD'],
    4194304: ['Cinema', 'CM'],
    8388608: ['Target', 'TP'],
    16777216: ['Key9', '9K'],
    33554432: ['KeyCoop', ''],
    67108864: ['Key1', '1K'],
    134217728: ['Key3', '3K'],
    268435456: ['Key2', '2K'],
    536870912: ['ScoreV2', 'SV2'],
    1073741824: ['Mirror', 'MR'],
}

const mods: string[][] = [
    ['None', 'NM'],
    ['NoFail', 'NF'],
    ['Easy', 'EZ'],
    ['TouchDevice', 'TD'],
    ['Hidden', 'HD'],
    ['HardRock', 'HR'],
    ['SuddenDeath', 'SD'],
    ['DoubleTime', 'DT'],
    ['Relax', 'RX'],
    ['HalfTime', 'HT'],
    ['Nightcore', 'NC'], // Only set along with DoubleTime. i.e: NC only gives 576
    ['Flashlight', 'FL'],
    ['Autoplay', 'AP'],
    ['SpunOut', 'SO'],
    ['Relax2', 'AP'], // Autopilot
    ['Perfect', 'PF'], // Only set along with SuddenDeath. i.e: PF only gives 16416  
    ['Key4', '4K'],
    ['Key5', '5K'],
    ['Key6', '6K'],
    ['Key7', '7K'],
    ['Key8', '8K'],
    ['FadeIn', 'FI'],
    ['Random', 'RD'],
    ['Cinema', 'CM'],
    ['Target', 'TP'],
    ['Key9', '9K'],
    ['KeyCoop', ''],
    ['Key1', '1K'],
    ['Key3', '3K'],
    ['Key2', '2K'],
    ['ScoreV2', 'SV2'],
    ['Mirror', 'MR'],
]

const modsFullRestricted: string[][] = [
    ['None', 'NM'],
    ['Easy', 'EZ'],
    ['HardRock', 'HR'],
    ['Hidden', 'HD'],
    ['DoubleTime', 'DT'],
    ['HalfTime', 'HT'],
    ['Flashlight', 'FL'],
    ['Key4', '4K'],
    ['Key5', '5K'],
    ['Key6', '6K'],
    ['Key7', '7K'],
    ['Key8', '8K'],
    ['Key9', '9K'],
    ['Key1', '1K'],
    ['Key3', '3K'],
    ['Key2', '2K'],
    ['Mirror', 'MR'],
]

const mods_restricted: string[] = ['NM', 'EZ', 'HR', 'HD', 'DT', 'HT', 'FL']

export function decomposeMods(modNumber: number) {
    let mods = [];
    for (const key in binaries) {
        const binaryKey = parseInt(key, 10);
        // If the bit for this mod is set in modNumber, add the short name to mods.
        if ((modNumber & binaryKey) === binaryKey) {
            const mod: Mod = {
                acronym: binaries[binaryKey][1].toLowerCase()
            }
            mods.push(mod);
        }
    }
    return mods;
}


export function parseModString(input: string | null) {

    let modString = "";
    if (input != null)
        modString = input.replace("+", "").toLowerCase();
    const parsedMods: string[] = [];

    mods.forEach((mod) => {
        if (modString.includes(mod[0].toLowerCase())) {
            if ('' == mod[1]) {
                modString = modString.replace(mod[0].toLowerCase(), "");
                parsedMods.push(mod[0])
            }
            else {
                modString = modString.replace(mod[0].toLowerCase(), "");
                parsedMods.push(mod[1])
            }
        }
    });

    mods.forEach((mod) => {
        if (modString.includes(mod[1].toLowerCase())) {
            if ('' == mod[1]) { }
            else {
                modString = modString.replace(mod[1].toLowerCase(), "");
                parsedMods.push(mod[1]);
            }
        }
    });

    return parsedMods;
}

export function parseModRestricted(input: string[] | null) {

    const return_mods: string[] = [];

    if (input == null) {
        return [];
    }

    mods_restricted.forEach((mod) => {
        input.forEach((i) => {
            if (i == 'NC') {
                i = 'DT'
            }
            if (mod == i) {
                return_mods.push(mod);
            }
        });
    });

    return return_mods;
}

export function arrayToBinary(mods?: Array<Mod>): number {
    let val = 0;

    if (mods) {
        for (const mod of mods) {
            const modLower = mod.acronym.trim().toLowerCase();

            // Special cases
            if (modLower === "td") {
                continue;
            } else if (modLower === "nc") {
                val += 64;
            } else if (modLower === "pf") {
                val += 16384;
            }

            // General cases
            for (const [key, values] of Object.entries(binaries)) {
                if (values.map(m => m.toLowerCase()).includes(modLower)) {
                    val += parseInt(key);
                    break; // Assuming one mod can't correspond to multiple binary values
                }
            }
        }
    }

    return val;
}

export function arraytoBinaryFix(mods?: Array<string>) {
    let val = 0;

    if (mods != undefined)
        for (const mod of mods) {
            for (const [key, values] of Object.entries(binaries))
                for (const arg of values) if (arg.trim().toLowerCase() == mod.trim().toLowerCase()) {

                    switch (mod.trim().toLowerCase()) {
                        case "nm":
                            val += 0;
                            break;
                        case "ez":
                            val += 2;
                            break;
                        case "hd":
                            val += 8;
                            break;
                        case "hr":
                            val += 16;
                            break;
                        case "dt":
                            val += 64;
                            break;
                        case "nc":
                            val += 64;
                            break;
                        case "ht":
                            val += 256;
                    }
                }
        }
    return val;
}

