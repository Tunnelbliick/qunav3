import { TextChannel, ChatInputCommandInteraction, Message, User, InteractionResponse, AttachmentBuilder } from "discord.js";
import { Gamemode } from "../../../interfaces/enum/gamemodes";
import { Server } from "../../../interfaces/enum/server";
import { thinking } from "../../../utility/thinking";
import { login } from "../../utility/banchoLogin";
import { v2 } from "osu-api-extended";
import { OsuUser } from "../../../interfaces/osu/user/osuUser";
import qunaUser from "../../../mongodb/qunaUser";
import { encrypt } from "../../../utility/jwt";
import { finishTransaction, startTransaction } from "../../utility/sentry";
import { buildCompressedProfile, buildProfileEmbed } from "../../../embeds/profile";
import { generateProfileChart } from "../../../graphs/profile/profile";
import { Arguments } from "../../../interfaces/arguments";
import { handleExceptions } from "../../utility/exceptionHandler";
import axios from "axios";
import { AkatsukiUser, AkatsukiUserInfo, AkatsukiUserRank } from "../../../interfaces/osu/user/akatsukiUser";

class ProfileArguments extends Arguments {
    check_skills: boolean | undefined;
    mode: Gamemode | undefined;
    server: Server | undefined;
}

export async function profile(channel: TextChannel, user: User, message: Message, interaction: ChatInputCommandInteraction, args: string[], mode: Gamemode) {

    const profileArguments: ProfileArguments = handleProfileParameters(user, args, interaction, mode);
    const transaction = startTransaction("Load Profile", "Load the User Profile", user.username, "profile");

    try {

        thinking(channel, interaction);

        let userData: OsuUser | undefined;

        if ((profileArguments.userid == undefined && profileArguments.username === undefined) && profileArguments.discordid) {

            await qunaUser.findOne({ discordid: await encrypt(profileArguments.discordid) }).then(userObject => {
                if (userObject === null) {
                    throw new Error("NOTLINKED");
                } else {
                    switch (profileArguments.server) {
                        case Server.AKATSUKI:
                        case Server.AKATSUKIAP:
                        case Server.AKATSUKIRX:
                            profileArguments.userid = userObject.akatsuki;
                            break;
                        default:
                            profileArguments.userid = userObject.userid;
                            break;
                    }
                }
            })

        }

        if (profileArguments.userid || profileArguments.username) {

            if (profileArguments.userid) {

                switch (profileArguments.server) {
                    case Server.AKATSUKI:
                        await getAkatsukiUserById(+profileArguments.userid, 0, profileArguments.mode).then((data: OsuUser) => {
                            userData = data;
                        })
                        break;
                    case Server.AKATSUKIAP:
                        await getAkatsukiUserById(+profileArguments.userid, 1, profileArguments.mode).then((data: OsuUser) => {
                            userData = data;
                        })
                        break;
                    case Server.AKATSUKIRX:
                        await getAkatsukiUserById(+profileArguments.userid, 2, profileArguments.mode).then((data: OsuUser) => {
                            userData = data;
                        })
                        break;
                    default:
                        await getBanchoUserById(+profileArguments.userid, profileArguments.mode).then((data: OsuUser) => {
                            userData = data;
                        })
                        break;
                }
            } else {
                await getBanchoUserByUsername(profileArguments.username!, profileArguments.mode).then((data: OsuUser) => {
                    userData = data;
                })
            }

        }

        if (userData === undefined) {
            throw new Error("NOTFOUND");
        }

        const embed = await buildProfileEmbed(userData, profileArguments.mode!)
        const chart = await generateProfileChart(userData);

        const file = new AttachmentBuilder(chart, { name: `${userData.id}_graph.png` });

        if (interaction) {
            interaction.editReply({ embeds: [embed], files: [file] }).then((msg) => {

                setTimeout(() => updateMessage(msg, file, userData!, profileArguments), 60000);
            });
        } else {
            channel.send({ embeds: [embed], files: [file] }).then((msg) => {

                setTimeout(() => updateMessage(msg, file, userData!, profileArguments), 60000);
            });
        }

    } catch (er: unknown) {
        handleExceptions(er as Error, profileArguments, interaction, message);
    } finally {
        finishTransaction(transaction);
    }

}

async function updateMessage(msg: Message | InteractionResponse, file: AttachmentBuilder, data: OsuUser, args: ProfileArguments) {
    const compact = await buildCompressedProfile(data, args.mode!);
    return msg.edit({ embeds: [compact], files: [file] });
}

function handleProfileParameters(user: User, args: string[], interaction: ChatInputCommandInteraction, default_mode: Gamemode): typeof profileArguments {

    let profileArguments: ProfileArguments = new ProfileArguments;

    if (interaction)
        profileArguments = handleInteractionOptions(interaction, default_mode);
    else
        profileArguments = handleLegacyArguments(user, args, default_mode);

    return profileArguments;
}

function handleInteractionOptions(interaction: ChatInputCommandInteraction, default_mode: Gamemode) {

    const profileArguments: ProfileArguments = new ProfileArguments;

    const options = interaction.options;

    profileArguments.username = options.getString("username", false) === null ? undefined : options.getString("username", false)!;
    profileArguments.userid = options.getString("userid", false) === null ? undefined : options.getString("userid", false)!;
    profileArguments.discordid = options.getMember("discord") === null ? interaction.user.id : options.getMember("discord")!.toString();
    profileArguments.check_skills = options.getBoolean("skills") === null ? false : options.getBoolean("skills", false)!;
    profileArguments.mode = (options.getString("mode", false) === null ? default_mode : options.getString("mode", false)!) as Gamemode;
    profileArguments.server = (options.getString("server", false) === null ? Server.BANCHO : options.getString("server", false)!.toUpperCase()) as Server;

    if (profileArguments.discordid) {
        profileArguments.discordid = profileArguments.discordid.replace("<@", "").replace(">", "");
    }

    return profileArguments;

}

function handleLegacyArguments(user: User, args: string[], default_mode: Gamemode) {

    const profileArguments: ProfileArguments = new ProfileArguments;

    profileArguments.server = Server.BANCHO;
    profileArguments.mode = default_mode;

    if (args.length === 0) {
        profileArguments.discordid = user.id;
        return profileArguments;
    }

    for (const arg of args) {

        switch (arg) {
            case "-ts":
                profileArguments.check_skills = true;
                break;
            case "-akatsuki":
                profileArguments.server = Server.AKATSUKI;
                break;
            case "-gatari":
                profileArguments.server = Server.GATARI;
                break;
            case "-bancho":
                profileArguments.server = Server.BANCHO;
                break;
            default:
                if (arg.startsWith("<@")) {
                    profileArguments.discordid = arg.replace("<@", "").replace(">", "");
                } else if (isNaN(+arg)) {
                    profileArguments.username = arg;
                } else {
                    profileArguments.userid = arg;
                }
        }

    }

    if (profileArguments.userid === undefined && profileArguments.username === undefined) {
        profileArguments.discordid = user.id;
    }

    return profileArguments;

}

export async function getBanchoUserById(userid: number, mode?: Gamemode): Promise<OsuUser> {
    await login();

    if (mode == undefined) {
        mode = "osu" as Gamemode;
    }

    return new Promise((resolve, reject) => {
        const user: Promise<OsuUser> = v2.user.details(userid, mode, "id") as Promise<OsuUser>

        user.then((data: OsuUser) => {
            if (data.hasOwnProperty("error")) {
                return reject(new Error("NOTFOUNDID"));
            }
            return resolve(data);
        });

        user.catch(() => {
            return reject(new Error("NOSERVER"));
        });
    });
}

export async function getBanchoUserByUsername(username: string, mode?: Gamemode): Promise<OsuUser> {
    await login();

    if (mode == undefined) {
        mode = "osu" as Gamemode;
    }

    return new Promise((resolve, reject) => {
        const user: Promise<OsuUser> = v2.user.details(username, mode, "username") as Promise<OsuUser>

        user.then((data: OsuUser) => {
            if (data.hasOwnProperty("error")) {
                return reject(new Error("NOTFOUNDUSERNAME"));
            }
            return resolve(data);
        });

        user.catch(() => {
            return reject(new Error("NOSERVER"));
        });
    });
}

export async function getAkatsukiUserById(userid: number, relax: number, mode: Gamemode | undefined): Promise<OsuUser> {
    let mode_int = 0;

    mode_int = getAkatsukiModeForServer(mode, relax, mode_int);

    try {

        const user: AkatsukiUser = (await axios.get(`${process.env.AKATSUKI_API}get_user?u=${userid}&m=${mode_int}`)).data[0];
        const info: AkatsukiUserInfo = (await axios.get(`${process.env.AKATSUKI_API}users?id=${userid}&mode=${mode_int}`)).data;
        const rank: AkatsukiUserRank = (await axios.get(`${process.env.AKATSUKI_API}profile-history/rank?user_id=${userid}&mode=${mode_int}`)).data.data;

        console.log(user);

        return akatsukiToOsu(user, info, rank);

    } catch (err) {

        console.log(err);

        throw new Error("NOSERVER");
    }
}

function getAkatsukiModeForServer(mode: Gamemode | undefined, relax: number, mode_int: number) {
    switch (mode) {
        case Gamemode.OSU:
            switch (relax) {
                case 1:
                    mode_int = 4;
                    break;
                case 2:
                    mode_int = 7;
                    break;
                default:
                    mode_int = 0;
                    break;
            }
            break;
        case Gamemode.TAIKO:
            switch (relax) {
                case 1:
                    mode_int = 5;
                    break;
                case 2:
                    mode_int = 5;
                    break;
                default:
                    mode_int = 1;
                    break;
            }
            break;
        case Gamemode.FRUITS:
            switch (relax) {
                case 1:
                    mode_int = 6;
                    break;
                case 2:
                    mode_int = 6;
                    break;
                default:
                    mode_int = 2;
                    break;
            }
            break;
        case Gamemode.MANIA:
            switch (relax) {
                case 1:
                    mode_int = 3;
                    break;
                case 2:
                    mode_int = 3;
                    break;
                default:
                    mode_int = 3;
                    break;
            }
            break;
    }
    return mode_int;
}

function akatsukiToOsu(user: AkatsukiUser, info: AkatsukiUserInfo, rank?: AkatsukiUserRank): OsuUser {
    return {
        avatar_url: `https://a.akatsuki.gg/${user.user_id}`,
        country_code: user.country,
        default_group: '', // Assuming no direct equivalent
        id: parseInt(user.user_id),
        is_active: false, // Assuming no direct equivalent
        is_bot: false, // Assuming no direct equivalent
        is_deleted: false, // Assuming no direct equivalent
        is_online: false, // Assuming no direct equivalent
        is_supporter: false, // Assuming no direct equivalent
        last_visit: info.latest_activity,
        pm_friends_only: false, // Assuming no direct equivalent
        profile_colour: '', // Assuming no direct equivalent
        username: user.username,
        cover_url: '', // Assuming no direct equivalent
        discord: '', // Assuming no direct equivalent
        has_supported: false, // Assuming no direct equivalent
        interests: '', // Assuming no direct equivalent
        join_date: user.join_date,
        kudosu: {
            total: 0, // Assuming no direct equivalent
            available: 0 // Assuming no direct equivalent
        },
        location: '', // Assuming no direct equivalent
        max_blocks: 0, // Assuming no direct equivalent
        max_friends: 0, // Assuming no direct equivalent
        occupation: '', // Assuming no direct equivalent
        playmode: '', // Assuming no direct equivalent
        playstyle: '', // Assuming no direct equivalent
        post_count: 0, // Assuming no direct equivalent
        profile_order: [], // Assuming no direct equivalent
        title: '', // Assuming no direct equivalent
        title_url: '', // Assuming no direct equivalent
        twitter: '', // Assuming no direct equivalent
        website: '', // Assuming no direct equivalent
        country: {
            code: user.country,
            name: '' // Assuming no direct equivalent
        },
        cover: {
            custom_url: '', // Assuming no direct equivalent
            url: '', // Assuming no direct equivalent
            id: 0 // Assuming no direct equivalent
        },
        account_history: [], // Assuming no direct equivalent
        active_tournament_banner: '', // Assuming no direct equivalent
        badges: [], // Assuming no direct equivalent
        beatmap_playcounts_count: 0, // Assuming no direct equivalent
        comments_count: 0, // Assuming no direct equivalent
        favourite_beatmapset_count: 0, // Assuming no direct equivalent
        follower_count: 0, // Assuming no direct equivalent
        graveyard_beatmapset_count: 0, // Assuming no direct equivalent
        groups: 
            {
                colour: "",
                has_listing: false,
                has_playmodes: false,
                id: 0,
                identifier: "",
                is_probationary: false,
                name: "",
                short_name: "",
                playmodes: [],
            }, // Assuming no direct equivalent
        guest_beatmapset_count: 0, // Assuming no direct equivalent
        loved_beatmapset_count: 0, // Assuming no direct equivalent
        mapping_follower_count: 0, // Assuming no direct equivalent
        monthly_playcounts: [], // Assuming no direct equivalent
        nominated_beatmapset_count: 0, // Assuming no direct equivalent
        page: {
            html: '', // Assuming no direct equivalent
            raw: '' // Assuming no direct equivalent
        },
        pending_beatmapset_count: 0, // Assuming no direct equivalent
        previous_usernames: [], // Assuming no direct equivalent
        rank_highest: {
            rank: 0, // Assuming no direct equivalent
            updated_at: '' // Assuming no direct equivalent
        },
        ranked_beatmapset_count: 0, // Assuming no direct equivalent
        replays_watched_counts: [], // Assuming no direct equivalent
        scores_best_count: 0, // Assuming no direct equivalent
        scores_first_count: 0, // Assuming no direct equivalent
        scores_pinned_count: 0, // Assuming no direct equivalent
        scores_recent_count: 0, // Assuming no direct equivalent
        statistics: {
            count_100: parseInt(user.count300),
            count_300: parseInt(user.count100),
            count_50: parseInt(user.count50),
            count_miss: 0, // Assuming no direct equivalent
            level: {
                current: parseInt(user.level),
                progress: 0 // Assuming no direct equivalent
            },
            global_rank: parseInt(user.pp_rank),
            global_rank_exp: 0, // Assuming no direct equivalent
            pp: parseFloat(user.pp_raw),
            pp_exp: 0, // Assuming no direct equivalent
            ranked_score: parseFloat(user.ranked_score),
            hit_accuracy: parseFloat(user.accuracy),
            play_count: parseInt(user.playcount),
            play_time: 0, // Assuming no direct equivalent
            total_score: parseFloat(user.total_score),
            total_hits: 0, // Assuming no direct equivalent
            maximum_combo: 0, // Assuming no direct equivalent
            replays_watched_by_others: 0, // Assuming no direct equivalent
            is_ranked: false, // Assuming no direct equivalent
            grade_counts: {
                ss: parseInt(user.count_rank_ss),
                ssh: parseInt(user.count_rank_ssh),
                s: parseInt(user.count_rank_s),
                sh: parseInt(user.count_rank_sh),
                a: parseInt(user.count_rank_a)
            },
            country_rank: parseInt(user.pp_country_rank),
            rank: {
                country: rank && rank.captures.length > 0 ? rank.captures[0].country : 0
            }
        },
        support_level: 0, // Assuming no direct equivalent
        user_achievements: [], // Assuming no direct equivalent
        rank_history: {
            mode: akatsukiModeToOsuMode(user.mode), // Assuming no direct equivalent
            data: akatsukiHistoryToOsuHistory(rank) // Assuming no direct equivalent
        },
        rankHistory: {
            mode: akatsukiModeToOsuMode(user.mode), // Assuming no direct equivalent
            data: akatsukiHistoryToOsuHistory(rank) // Assuming no direct equivalent
        },
        ranked_and_approved_beatmapset_count: 0, // Assuming no direct equivalent
        unranked_beatmapset_count: 0 // Assuming no direct equivalent
    };
}


function akatsukiModeToOsuMode(mode_int: number): string {
    switch (mode_int) {
        case 0:
            return "osu";
        case 1:
            return "taiko";
        case 2:
            return "fruits";
        case 3:
            return "mania";
        default:
            return "osu";
    }
}

function akatsukiHistoryToOsuHistory(rank?: AkatsukiUserRank) {

    const data: number[] = [];

    if(rank && rank.captures)
    rank.captures.forEach(caputre => {
        data.push(caputre.overall);
    })

    return data;
}