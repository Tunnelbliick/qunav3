import { Mod } from "../../../interfaces/osu/Mod/mod";
import { difficulty } from "../../../interfaces/pp/difficulty";
import { arrayToBinary } from "../../../utility/parsemods";

const ppcalc = require('quna-pp');

export async function getBeatmapDifficulty(mapid: number, checksum: string, mods:Mod[]) {

    const modbinary = arrayToBinary(mods);

    const map_difficulty: difficulty = await ppcalc.difficutly(`${process.env.FOLDER_TEMP}${mapid}_${checksum}.osu`, modbinary);

    return map_difficulty
}