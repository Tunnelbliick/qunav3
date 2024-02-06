import { v2 } from "osu-api-extended";
import { OsuScore } from "../../../interfaces/osu/score/osuScore";
import { Top, TopData } from "../../../interfaces/osu/top/top";
import { loadUnrankedTop } from "../../unranked/top";
import { login } from "../../utility/banchoLogin";
import { Gamemode, modeIdToEnum } from "../../../interfaces/enum/gamemodes";
import { BanchoParams } from "../../../interfaces/arguments";
import userHash from "../../../mongodb/userHash";
import cacheTop from "../../../mongodb/cacheTop";
import { convertModsToStrings } from "../../../interfaces/osu/Mod/mod";
import { TopPlayArguments, UserBest } from "./topHandler";
import { topFilterAndSort } from "./utility/filterTopPlays";
import { downloadBeatmap } from "../../utility/downloadbeatmap";
import { off } from "process";
const makeHash = require("hash-sum")

export enum TopType {
    NORMAL,
    NOTSUBMITTED,
    FAILED,
    SCOREV1D, // Higher pp less score
    IFRANKED, // If the beatmap would be ranked
}

export class TopPosition {
    index: number | undefined = undefined;
    type: TopType | undefined = undefined;
}


export async function getTopPlaysForUser(userid: number, args: TopPlayArguments) {

    // Get recent plays
    const max = 10;
    const offset = 0;

    const topPlays = await getTopForUser(userid, args.mode ?? Gamemode.OSU, offset, max, false);
    if (topPlays.length == 0) {
        throw new Error("NORECENTPLAYS");
    }

    // Apply filter
    const filteredTop = topFilterAndSort(topPlays, args);
    if (filteredTop.length > 0) {
        throw new Error("NOPLAYFOUND");
    }

    //const common = await getCommonData(recentplay);

    const userBest: UserBest = new UserBest();
    userBest.scores = topPlays;


    return userBest;
}

export async function getTopForUser(userid: number, mode: Gamemode, offset?: number, limit?: number, unranked?: boolean): Promise<OsuScore[]> {

    let bestplays: OsuScore[] = [];

    if (unranked === true) {
        bestplays = await loadUnrankedTop(userid, mode);
    } else {
        bestplays = await loadAndCacheTopFromBancho(bestplays, userid, offset, limit, mode);
    }

    if (bestplays == undefined || bestplays == null) {
        throw new Error("NOPLAYSFOUND")
    }

    return bestplays;
}

async function loadAndCacheTopFromBancho(bestplays: OsuScore[], userid: number, offset: number | undefined, limit: number | undefined, mode: Gamemode) {

    bestplays = await getBanchoTop(userid, offset, limit, mode);

    let hash = await userHash.findOne({ osuid: userid });

    // If hash is null create new hash
    if (hash === undefined || hash === null) {
        hash = new userHash();
        hash.osuid = userid;
    }

    const topData: TopData[] = [];
    const top: Top = {
        osuid: userid,
        mode: mode,
        topData: topData
    };

    bestplays.forEach((play: OsuScore, index: number) => {

       /* if (play.mode !== mode) {
            mode = play.mode as Gamemode;
        }*/

        const data: TopData = {
            index: index,
            scoreid: play.id,
            pp: play.pp!.toString(),
            score: play.total_score.toString(),
            mode: modeIdToEnum(play.ruleset_id).toString(),
            mods: convertModsToStrings(play.mods),
            beatmapid: play.beatmap.id,
        };

        topData.push(data);
    });

    top.topData = topData;

    const top100String: string[] = top.topData.map((data: TopData) => {
        return `${data.scoreid}`;
    });

    const topHash: string = makeHash(JSON.stringify(top100String));

    if (hash === null || hash.topHash !== topHash || hash.topHash === undefined || hash.topHash === null) {

        const top = new cacheTop();
        top.osuid = userid;
        top.mode = mode;
        top.topData = topData;

        hash.topHash = topHash;

        await top.save();
        await hash.save();

    }
    return bestplays;
}

export async function getBanchoTop(userid: number, offset?: string, limit?: string, mode?: Gamemode): Promise<OsuScore[]> {

    try {
        await login();

        const params: BanchoParams = {
            limit,
            mode,
            offset
        };

        const data: object = await v2.scores.user.category(userid, "best", params);

        if (data.hasOwnProperty("error")) {
            throw new Error("NOTFOUNDID");
        }

        return data as OsuScore[];
    } catch {
        throw new Error("NOSERVER");
    }
}

export async function getTopPositionForUser(play: OsuScore, mode: Gamemode, unranked: boolean) {

    const top = await getTopForUser(play.user_id, mode, "0", "100", false)

    const position = new TopPosition();

    let foundTop = top.find(s => s.best_id.id === play.best_id);

    if (foundTop) {
        position.index = foundTop.position;
        position.type = TopType.NORMAL

        return position;
    }

    const sameBeatmap = top.find(s => s.beatmap.id === play.beatmap.id);

    // If the same beatmap is in top check if sv1d
    if (sameBeatmap) {

        const beatmapScore = sameBeatmap;

        if (play.pp && beatmapScore.pp! < play.pp && beatmapScore.total_score > play.total_score) {
            position.index = sameBeatmap.position;
            position.type = TopType.SCOREV1D;

            return position;
        }

    }

    foundTop = top.find(s => s.pp! < play.pp!);

    if (foundTop) {

        if (unranked) {
            position.index = foundTop.position;
            position.type = TopType.NOTSUBMITTED
        } else {
            position.index = foundTop.position;
            position.type = TopType.IFRANKED;
        }
    }

    return position;



}