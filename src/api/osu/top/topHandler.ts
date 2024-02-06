import { ChatInputCommandInteraction, Message, TextChannel, User } from "discord.js";
import { Arguments } from "../../../interfaces/arguments";
import { Gamemode } from "../../../interfaces/enum/gamemodes";
import { Server } from "../../../interfaces/enum/server";
import { OsuScore } from "../../../interfaces/osu/score/osuScore";
import { OsuUser } from "../../../interfaces/osu/user/osuUser";
import { difficulty } from "../../../interfaces/pp/difficulty";
import { handleInteractionOptions, handleLegacyArguments } from "./handleTopParameters";
import { finishTransaction, startTransaction } from "../../utility/sentry";
import { thinking } from "../../../utility/thinking";
import qunaUser from "../../../mongodb/qunaUser";
import { encrypt } from "../../../utility/jwt";
import { getTopForUser, getTopPlaysForUser } from "./topBancho";
import { handleExceptions } from "../../utility/exceptionHandler";

export class TopPlayArguments extends Arguments {
    search: string = "";
    offset: number = 0;
    mods: string[] = [];
    rank: string | undefined;
    mode: Gamemode | undefined;
    server: Server | undefined;
    combo: string | undefined;
    accuracy: string | undefined;
    sort: "acc" | "combo" | "length" | "pp" | undefined = "pp";
    reverse: boolean = false;
}

type PerformanceReturnTypes = difficulty | number | undefined; // Update as per your actual types

export class CommonData {
    user: OsuUser | undefined;
}

export type CommonDataReturnTypes = OsuUser | undefined;

export class UserBest {
    scores: OsuScore[] | undefined;
    user: OsuUser | undefined;
    server: Server | undefined;
}

export function handleTopParameters(user: User, args: string[], interaction: ChatInputCommandInteraction, default_mode: Gamemode) {

    let topPlayArguments: TopPlayArguments = new TopPlayArguments;

    if (interaction)
        topPlayArguments = handleInteractionOptions(interaction, default_mode);

    else
        topPlayArguments = handleLegacyArguments(user, args, default_mode);

    return topPlayArguments;
}

export async function top(channel: TextChannel, user: User, message: Message, interaction: ChatInputCommandInteraction, args: string[], mode: Gamemode) {

    const topPlayArguments: TopPlayArguments = handleTopParameters(user, args, interaction, mode);
    const transaction = startTransaction("Topplays", "Shows the topplays for a user", user.username, "topplays");
    let bestScores = new UserBest();

    try {

        thinking(channel, interaction);

        if ((topPlayArguments.userid == undefined && topPlayArguments.username === undefined) && topPlayArguments.discordid) {

            await qunaUser.findOne({ discordid: await encrypt(topPlayArguments.discordid) }).then(userObject => {
                if (userObject === null) {
                    throw new Error("NOTLINKED");
                } else {
                    switch (topPlayArguments.server) {
                        case Server.AKATSUKIAP:
                        case Server.AKATSUKIRX:
                        case Server.AKATSUKI:
                            topPlayArguments.userid = userObject.akatsuki;
                            break;
                        default:
                            topPlayArguments.userid = userObject.userid;
                            break;
                    }
                }
            })
        }

        if (topPlayArguments.userid) {

            switch (topPlayArguments.server) {
                /*case Server.AKATSUKIAP:
                    case Server.AKATSUKIRX:
                    case Server.AKATSUKI:
                        bestScores = await getRecentPlaysForUserAkatsuki(+recentPlayArguments.userid, recentPlayArguments, recentPlayArguments.mode);
                    break;*/
                default:
                    bestScores = await getTopPlaysForUser(+topPlayArguments.userid, topPlayArguments);
                    break;
            }

        }

        /*const embed = generateRecentEmbed(recentScore, undefined);

        if (interaction) {
            interaction.editReply({ embeds: [embed] }).then((msg) => {

                setTimeout(() => updateMessage(msg, recentScore), 60000);
            });
        } else {
            channel.send({ embeds: [embed] }).then((msg) => {

                setTimeout(() => updateMessage(msg, recentScore), 60000);
            });
        }*/

        console.log(bestScores);


    } catch (er: unknown) {
        handleExceptions(er as Error, topPlayArguments, interaction, message);
    } finally {
        finishTransaction(transaction);
    }
}