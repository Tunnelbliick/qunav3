import { TextChannel, ChatInputCommandInteraction, Message, User, InteractionResponse } from "discord.js";
import { Gamemode, modeIdToEnum } from "../../../interfaces/enum/gamemodes";
import { Server } from "../../../interfaces/enum/server";
import { thinking } from "../../../utility/thinking";
import { OsuUser } from "../../../interfaces/osu/user/osuUser";
import qunaUser from "../../../mongodb/qunaUser";
import { encrypt } from "../../../utility/jwt";
import { finishTransaction, sentryError, startTransaction } from "../../utility/sentry";
import { Arguments } from "../../../interfaces/arguments";
import { handleExceptions } from "../../utility/exceptionHandler";
import { OsuScore } from "../../../interfaces/osu/score/osuScore";
import { simulateRecentPlay, simulateRecentPlayFC } from "../../pp/rosupp/simulate";
import { getBeatmapDifficulty } from "../../pp/rosupp/difficulty";
import { loadacc100WithoutBeatMapDownload } from "../../pp/db/loadSS";
import { difficulty } from "../../../interfaces/pp/difficulty";
import { OsuBeatmap } from "../../../interfaces/osu/beatmap/osuBeatmap";
import { TopPosition } from "../top/topBancho";
import { LeaderboardPosition } from "../leaderboard/leaderboard";
import { generateRecentEmbed, generateRecentEmbedCompact } from "../../../embeds/recent";
import { handleRecentParameters } from "./handleRecentParameters";
import { getRecentPlaysForUserAkatsuki } from "./recentAkatsuki";
import { getRecentPlaysForUserBancho } from "./recentBancho";

import { ScoresDetails } from "osu-api-extended/dist/types/scores_details";

export class RecentPlayArguments extends Arguments {
    search: string = "";
    offset: number = 0;
    mods: string[] = [];
    rank: string | undefined;
    include_fails: boolean = true;
    mode: Gamemode | undefined;
    server: Server | undefined;
}

export class Performance {
    difficulty: difficulty | undefined;
    accSS: number | undefined;
    simulated: number | undefined;
    simulatedFc: number | undefined;
}

type PerformanceReturnTypes = difficulty | number | undefined; // Update as per your actual types

export class CommonData {
    user: OsuUser | undefined;
    beatmap: OsuBeatmap | undefined;
    leaderboard: LeaderboardPosition | undefined;
    best: TopPosition | undefined;
}

export type CommonDataReturnTypes = OsuUser | OsuBeatmap | TopPosition | LeaderboardPosition | undefined;

export class RecentScore {
    retry_count: number | undefined;
    leaderboard: LeaderboardPosition | undefined;
    best: TopPosition | undefined;
    score: OsuScore | undefined;
    user: OsuUser | undefined;
    beatmap: OsuBeatmap | undefined;
    server: Server | undefined;
    performance: Performance | undefined;
}

export async function recent(channel: TextChannel, user: User, message: Message, interaction: ChatInputCommandInteraction, args: string[], mode: Gamemode) {

    const recentPlayArguments: RecentPlayArguments = handleRecentParameters(user, args, interaction, mode);
    const transaction = startTransaction("Recentplay", "Shows the recentplay for a user", user.username, "recent");
    let recentScore = new RecentScore();

    try {

        thinking(channel, interaction);

        if ((recentPlayArguments.userid == undefined && recentPlayArguments.username === undefined) && recentPlayArguments.discordid) {

            await qunaUser.findOne({ discordid: await encrypt(recentPlayArguments.discordid) }).then(userObject => {
                if (userObject === null) {
                    throw new Error("NOTLINKED");
                } else {
                    switch (recentPlayArguments.server) {
                        case Server.AKATSUKIAP:
                        case Server.AKATSUKIRX:
                        case Server.AKATSUKI:
                            recentPlayArguments.userid = userObject.akatsuki;
                            break;
                        default:
                            recentPlayArguments.userid = userObject.userid;
                            break;
                    }
                }
            })
        }

        if (recentPlayArguments.userid) {

            switch (recentPlayArguments.server) {
                case Server.AKATSUKIAP:
                    case Server.AKATSUKIRX:
                    case Server.AKATSUKI:
                    recentScore = await getRecentPlaysForUserAkatsuki(+recentPlayArguments.userid, recentPlayArguments, recentPlayArguments.mode);
                    break;
                default:
                    recentScore = await getRecentPlaysForUserBancho(+recentPlayArguments.userid, recentPlayArguments, recentPlayArguments.mode);
                    break;
            }

        }

        const embed = generateRecentEmbed(recentScore, undefined);

        if (interaction) {
            interaction.editReply({ embeds: [embed] }).then((msg) => {

                setTimeout(() => updateMessage(msg, recentScore), 60000);
            });
        } else {
            channel.send({ embeds: [embed] }).then((msg) => {

                setTimeout(() => updateMessage(msg, recentScore), 60000);
            });
        }


    } catch (er: unknown) {
        handleExceptions(er as Error, recentPlayArguments, interaction, message);
    } finally {
        finishTransaction(transaction);
    }
}

async function updateMessage(msg: Message | InteractionResponse, data: RecentScore) {
    const compact = await generateRecentEmbedCompact(data, false);
    return msg.edit({ embeds: [compact] });
}

export async function getPerformance(score: OsuScore) {

    const performance: Performance = new Performance();

    const diff = getBeatmapDifficulty(score.beatmap.id, score.beatmap.checksum, score.mods);
    const accSS = await loadacc100WithoutBeatMapDownload(score.beatmap.id, score.beatmap.checksum, score.mods, modeIdToEnum(score.ruleset_id));
    let simulated = undefined;
    let simulatedFc = undefined;

    if (score.pp === null) {
        simulated = simulateRecentPlay(score);
        simulatedFc = simulateRecentPlayFC(score);
    } else {
        simulated = score.pp;
        simulatedFc = simulateRecentPlayFC(score);
    }

    await Promise.allSettled([diff, accSS, simulated, simulatedFc])
        .then((results: PromiseSettledResult<PerformanceReturnTypes>[]) => {
            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    switch (index) {
                        case 0:
                            performance.difficulty = result.value as difficulty;
                            break;
                        case 1:
                            performance.accSS = result.value as number;
                            break;
                        case 2:
                            performance.simulated = result.value as number;
                            break;
                        case 3:
                            performance.simulatedFc = result.value as number;
                            break;
                    }
                } else {
                    const err = new Error(`Promise ${index} was rejected with reason: ${result.reason}`);
                    sentryError(err);
                }
            });
        });
    

    return performance;
}