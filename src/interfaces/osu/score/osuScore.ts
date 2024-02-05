import { stat } from "fs";
import { Mod } from "../Mod/mod";

export interface OsuScore {
    max_pp?: number;
    position?: number;
    mods_id?: number;
    maximum_statistics: statistics;
    mods: Array<Mod>;
    statistics: statistics;
    beatmap_id: number;
    best_id: any;
    id: number;
    rank: string;
    type?: string;
    user_id: number;
    accuracy: number;
    build_id: any;
    ended_at: string;
    has_replay: boolean;
    legacy_perfect: any;
    legacy_score_id: number;
    legacy_total_score: number;
    max_combo: number;
    passed: boolean;
    pp?: number;
    ruleset_id: number;
    started_at: any;
    total_score: number;
    replay: boolean;
    current_user_attributes: {
        pin: any;
    };
    beatmap: {
        beatmapset_id: number;
        difficulty_rating: number;
        id: number;
        mode: string;
        status: string;
        total_length: number;
        user_id: number;
        version: string;
        accuracy: number;
        ar: number;
        bpm: number;
        convert: boolean;
        count_circles: number;
        count_sliders: number;
        count_spinners: number;
        cs: number;
        deleted_at: any;
        drain: number;
        hit_length: number;
        is_scoreable: boolean;
        last_updated: string;
        mode_int: number;
        passcount: number;
        playcount: number;
        ranked: number;
        url: string;
        checksum: string;
    };
    beatmapset: {
        artist: string;
        artist_unicode: string;
        covers: {
            cover: string;
            "cover@2x": string;
            card: string;
            "card@2x": string;
            list: string;
            "list@2x": string;
            slimcover: string;
            "slimcover@2x": string;
        };
        creator: string;
        favourite_count: number;
        hype: any;
        id: number;
        nsfw: boolean;
        offset: number;
        play_count: number;
        preview_url: string;
        source: string;
        spotlight: boolean;
        status: string;
        title: string;
        title_unicode: string;
        track_id?: string;
        user_id: number;
        video: boolean;
    };
    user?: {
        avatar_url: string;
        country_code: string;
        default_group: string;
        id: number;
        is_active: boolean;
        is_bot: boolean;
        is_deleted: boolean;
        is_online: boolean;
        is_supporter: boolean;
        last_visit: string;
        pm_friends_only: boolean;
        profile_colour: any;
        username: string;
    }
}

export interface statistics {
    great: number;
    ok?: number;
    meh?: number;
    miss?: number;
    large_tick_hit?: number; // ctb
    small_tick_hit?: number; // ctb
    large_tick_miss?: number; // ctb
    small_tick_miss?: number; // ctb
    perfect?: number; // mania
    good?: number; // mania
    legacy_combo_increase?: number;
}

export interface oldStatistics {
    count_100: number;
    count_300: number;
    count_50: number;
    count_geki: number;
    count_katu: number;
    count_miss: number;
}

export function modeToRuleset(mode: string) {
    switch(mode){ 
    case "osu":
        return 0;
    case "taiko":
        return 1;
    case "fruits":
        return 2;
    case "mania":
        return 3;
    default:
        return 0;
    }
}

export function parseStatisticsOldToNew(statistics: oldStatistics): statistics {
    return {
        great: statistics.count_300,
        ok: statistics.count_100,
        meh: statistics.count_50,
        miss: statistics.count_miss,
        small_tick_miss: statistics.count_katu,
        perfect: statistics.count_geki,
        good: statistics.count_katu
    }
}

export function displayStandard(statistics: statistics): string {
    return `{${statistics.great ?? 0}/${statistics.ok ?? 0}/${statistics.meh ?? 0}/${statistics.miss ?? 0}}`;
}

export function displayMania(statistics: statistics): string {
    return `{${statistics.perfect ?? 0}/${statistics.great ?? 0}/${statistics.good ?? 0}/${statistics.ok ?? 0}/${statistics.meh ?? 0}/${statistics.miss ?? 0}}`;
}

export function displayTaiko(statistics: statistics): string {
    return `{${statistics.great ?? 0}/${statistics.ok ?? 0}/${statistics.miss ?? 0}}`;
}

export function displayFruits(statistics: statistics): string {
    return `{${statistics.great ?? 0}/${statistics.large_tick_hit ?? 0}/${statistics.small_tick_hit ?? 0}/${statistics.miss ?? 0}}`;
}
