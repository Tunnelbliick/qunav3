import { modeIdToEnum } from "../../interfaces/enum/gamemodes";
import { OsuBeatmap } from "../../interfaces/osu/beatmap/osuBeatmap";
import { OsuScore } from "../../interfaces/osu/score/osuScore";
import { Score } from "../../interfaces/osu/score/score";

export interface BeatmapStats {
    cs: number,
    hp: number,
    bpm: number,
    mapLength: number,
    mapDrain: number,
    min?: number,
    strSec?: string,
    dmin?: number,
    strDsec?: string,
    color?: string,
    total_objects?: number
}

/*
export function calcualteStatsFromSuggestion(suggestion: any) {

    const stats: BeatmapStats = {
        cs: suggestion.cs,
        hp: suggestion.hp,
        bpm: suggestion.bpm,
        mapLength: suggestion.length,
        mapDrain: suggestion.drain,
        total_objects: parseInt(suggestion.circles) + parseInt(suggestion.sliders) + parseInt(suggestion.spinners)
    }

    return calcualteStatsforMods(stats, suggestion.mods);

}*/

export function calcualteStatsFromBeatmapforMods(beatmap: OsuBeatmap, mods: string[]) {

    const stats: BeatmapStats = {
        cs: beatmap.cs,
        hp: beatmap.drain,
        bpm: beatmap.beatmapset.bpm ? beatmap.beatmapset.bpm : 0,
        mapLength: beatmap.total_length,
        mapDrain: beatmap.hit_length,
        total_objects: beatmap.count_circles + beatmap.count_sliders + beatmap.count_spinners
    }

    return calcualteStatsforMods(stats, mods);

}

export function calcualteStatsforMods(stats: BeatmapStats, mods: string[]) {

    if (mods.includes("EZ")) {
        stats.cs = stats.cs * 0.5
        stats.hp = stats.hp * 0.5
    }
    if (mods.includes("HR")) {
        stats.cs = stats.cs * 1.3;
        stats.hp = stats.hp * 1.4;
    }

    if (mods.includes("DT") || mods.includes("NC")) {
        stats.bpm = Math.round(stats.bpm * 1.5);
        stats.mapLength = stats.mapLength / 1.5
        stats.mapDrain = stats.mapDrain / 1.5
    }
    if (mods.includes("HT")) {
        stats.bpm = Math.round(stats.bpm * 0.75);
        stats.mapLength = stats.mapLength / 0.75
        stats.mapDrain = stats.mapDrain / 0.75
    }

    if (stats.cs > 10) {
        stats.cs = 10;
    }

    if (stats.hp > 10) {
        stats.hp = 10;
    }

    stats.min = Math.floor(stats.mapLength / 60)
    const sec = Math.floor(stats.mapLength - stats.min * 60)
    stats.strSec = sec.toFixed(0).toString()
    if (sec < 10) { stats.strSec = "0" + sec }

    stats.dmin = Math.floor(stats.mapDrain / 60)
    const dsec = Math.floor(stats.mapDrain - stats.dmin * 60)
    stats.strDsec = dsec.toFixed(0).toString()
    if (dsec < 10) { stats.strDsec = "0" + dsec }

    return stats;

}

export function calculateFcAcc(score: OsuScore, total_objects: number) {
    let fc_acc = 100;

    switch (modeIdToEnum(score.ruleset_id)) {
        case "osu":
            fc_acc = (100 * (6 * (total_objects - score.statistics.great - (score.statistics.meh ?? 0)) + 2 * (score.statistics.ok ?? 0) + (score.statistics.meh ?? 0)) / (6 * total_objects));
            break;
        case "mania":
            // Mania calculation logic, if any
            break;
        case "taiko":
            fc_acc = 100 * ((2 * ((score.statistics.great ?? 0) + (score.statistics.miss ?? 0) + (score.statistics.ok ?? 0))) / (2 * total_objects));
            break;
        case "fruits":
            fc_acc = 100 * ((score.statistics.great ?? 0) + (score.statistics.ok ?? 0) + (score.statistics.meh ?? 0)) / ((score.statistics.great ?? 0) + (score.statistics.ok ?? 0) + (score.statistics.meh ?? 0) + (score.statistics.small_tick_miss ?? 0));
            break;
    }

    return fc_acc;
}


export function calculateAcc(score: OsuScore, total_objects: number) {
    let acc = 100;

    switch (modeIdToEnum(score.ruleset_id)) {
        case "osu":
            acc = (100 * (6 * (score.statistics.great ?? 0) + 2 * (score.statistics.ok ?? 0) + (score.statistics.meh ?? 0)) / (6 * total_objects));
            break;
        case "mania":
            // Mania calculation logic, if any
            break;
        case "taiko":
            acc = 100 * ((2 * (score.statistics.great ?? 0) + (score.statistics.ok ?? 0)) / (2 * ((score.statistics.great ?? 0) + (score.statistics.ok ?? 0) + (score.statistics.miss ?? 0))));
            break;
        case "fruits":
            acc = 100 * ((score.statistics.great ?? 0) + (score.statistics.ok ?? 0) + (score.statistics.meh ?? 0)) / ((score.statistics.great ?? 0) + (score.statistics.ok ?? 0) + (score.statistics.meh ?? 0) + (score.statistics.small_tick_miss ?? 0));
            break;
    }

    return acc;
}
