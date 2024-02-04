import { Gamemode } from "../../interfaces/enum/gamemodes";
import beatmap from "../../mongodb/beatmap";
import { Beatmap } from "../../interfaces/osu/beatmap/beatmap";
import { OsuBeatmap } from "../../interfaces/osu/beatmap/osuBeatmap";
import { Score } from "../../interfaces/osu/score/score";
import { modeToRuleset, OsuScore, parseStatisticsOldToNew } from "../../interfaces/osu/score/osuScore";
import { stringToModArray } from "../../interfaces/osu/Mod/mod";
import score from "../../mongodb/score";

export async function loadUnrankedTop(user_id: number, mode: Gamemode) {

    const returnArray: OsuScore[] = [];

    if (isNaN(user_id))
        return [];

    const userid = +user_id;

    const top100: Score[] = await score.find({
        osuid: userid,
        mode: mode,
        max_pp: { $lte: 3000 }
    }).sort({ pp: -1 }).limit(100).exec();

    const mapidlist: number[] = [];

    top100.forEach((top: Score) => {
        mapidlist.push(top.mapid);
    });

    const beatmaps: Beatmap[] = await beatmap.find({ mapid: { $in: mapidlist } });
    const beatmapMap = new Map<number, OsuBeatmap>();

    beatmaps.forEach((beatmap: Beatmap) => {

        const map: OsuBeatmap = beatmap.beatmap as OsuBeatmap;

        beatmapMap.set(map.id, map);

    })

    top100.forEach((top: Score) => {

        const beatmap = beatmapMap.get(top.mapid);

        const score: OsuScore = {
            accuracy: top.accuracy,
            beatmap: beatmap!,
            beatmapset: beatmap!.beatmapset,
            ended_at: top.created_at.toString(),
            id: 0,
            max_combo: top.max_combo,
            ruleset_id: modeToRuleset(top.mode),
            mods: stringToModArray(top.mods),
            passed: true,
            pp: top.pp,
            max_pp: top.max_pp,
            replay: false,
            total_score: top.score,
            statistics: parseStatisticsOldToNew(top.statistics),
            user_id: top.osuid,
            beatmap_id: 0,
            best_id: top.id,
            build_id: 0,
            current_user_attributes: {
                pin: false
            },
            has_replay: false,
            legacy_perfect: false,
            legacy_score_id: 0,
            legacy_total_score: top.score,
            maximum_statistics: {
                great: 0,
                legacy_combo_increase: 0
            },
            rank: top.rank,
            started_at: top.created_at,


        };

        returnArray.push(score);

    })

    return returnArray;

}