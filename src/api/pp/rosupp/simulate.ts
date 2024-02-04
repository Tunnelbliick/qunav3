import { modeIdToEnum } from "../../../interfaces/enum/gamemodes";
import { Mod } from "../../../interfaces/osu/Mod/mod";
import { OsuBeatmap } from "../../../interfaces/osu/beatmap/osuBeatmap";
import { OsuScore } from "../../../interfaces/osu/score/osuScore";
import { arrayToBinary } from "../../../utility/parsemods";
import { sentryError } from "../../utility/sentry";

const ppcalc = require('quna-pp');

export interface simulateArgs {
    mapid: string;
    checksum: string;
    misses: number;
    mehs: number;
    goods: number;
    great: number;
    combo: number;
    score: number;
    mode: string;
    mods: Mod[];

}

export async function simulateRecentPlay(recentplay: OsuScore): Promise<number> {

    const args: simulateArgs = {
        mapid: recentplay.beatmap.id.toString(),
        checksum: recentplay.beatmap.checksum,
        misses: recentplay.statistics.miss!,
        mehs: recentplay.statistics.meh!,
        goods: recentplay.statistics.ok!,
        great: recentplay.statistics.great!,
        combo: recentplay.max_combo,
        score: recentplay.total_score,
        mode: modeIdToEnum(recentplay.ruleset_id).toString(),
        mods: recentplay.mods
    }

    return simulate(args);
}

export async function simulateRecentPlayFC(recentplay: OsuScore): Promise<number> {

    const args: simulateArgs = {
        mapid: recentplay.beatmap.id.toString(),
        checksum: recentplay.beatmap.checksum,
        misses: 0,
        mehs: recentplay.statistics.meh!,
        goods: recentplay.statistics.ok!,
        great: 0,
        combo: recentplay.max_combo,
        score: recentplay.total_score,
        mode: modeIdToEnum(recentplay.ruleset_id).toString(),
        mods: recentplay.mods
    }

    return simulateFC(args);

}

export async function simulate(args: simulateArgs): Promise<number> {

    try {
        const modbinary = arrayToBinary(args.mods);

        let map_pp = null;
        switch (args.mode) {
            case "mania":
                map_pp = await ppcalc.simulatemania(`${process.env.FOLDER_TEMP}${args.mapid}_${args.checksum}.osu`, modbinary, args.score);
                break;
            default:
                map_pp = await ppcalc.simulatestd(`${process.env.FOLDER_TEMP}${args.mapid}_${args.checksum}.osu`, modbinary, args.great, args.goods, args.mehs, args.misses, args.combo);
                break;
        }

        return map_pp;

    } catch (err: unknown) {
        sentryError(err as Error);
    }

    return 0;
}

export async function simulateFC(args: simulateArgs): Promise<number> {

    try {

        const modbinary = arrayToBinary(args.mods);

        let map_pp = null;
        switch (args.mode) {
            case "mania":
                map_pp = await ppcalc.simulatemania(`${process.env.FOLDER_TEMP}${args.mapid}_${args.checksum}.osu`, modbinary, args.score);
                break;
            default:
                map_pp = await ppcalc.simulatestd(`${process.env.FOLDER_TEMP}${args.mapid}_${args.checksum}.osu`, modbinary, 0, args.goods, args.mehs, 0, args.combo);
                break;
        }

        return map_pp

    } catch (err: unknown) {
        sentryError(err as Error);
    }

    return 0;
}