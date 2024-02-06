import { ChatInputCommandInteraction, User } from "discord.js";
import { Gamemode } from "../../../interfaces/enum/gamemodes";
import { buildUsernameOfArgs } from "../../utility/buildusernames";
import { TopPlayArguments } from "./topHandler";
import { parseModString } from "../../../utility/parsemods";
import { Server } from "../../../interfaces/enum/server";

enum LegacyMode {
    None,
    Gamemode,
    Search,
    Mods,
    Rank,
    Combo,
    Sort,
    Reverse,
    Accuracy
}

type CommandGroup = {
    commands: string[],
    handler: () => LegacyMode,
};

const commandGroups: CommandGroup[] = [
    {
        commands: ["-g", "-gamemode", "g", "gamemode", "mode", "-mode"],
        handler: () => { return LegacyMode.Gamemode },
    },
    {
        commands: ["-s", "-search", "s", "search", "-q", "-query", "q", "query"],
        handler: () => { return LegacyMode.Search },
    },
    {
        commands: ["-m", "-mods", "m", "mods"],
        handler: () => { return LegacyMode.Mods },
    },
    {
        commands: ["-r", "-rank", "r", "rank"],
        handler: () => { return LegacyMode.Rank },
    },
    {
        commands: ["-c", "-combo", "c", "combo"],
        handler: () => { return LegacyMode.Combo },
    },
    {
        commands: ["-sort", "sort"],
        handler: () => { return LegacyMode.Sort },
    },
    {
        commands: ["-reverse", "reverse"],
        handler: () => { return LegacyMode.Reverse },
    },
    {
        commands: ["-acc", "-accuracy","acc", "accuracy"],
        handler: () => { return LegacyMode.Accuracy },
    },
];

function buildHandlers(): { [command: string]: () => LegacyMode } {
    const handlers: { [command: string]: () => LegacyMode } = {};
    for (const group of commandGroups) {
        for (const command of group.commands) {
            handlers[command] = group.handler;
        }
    }
    return handlers;
}

export function handleLegacyArguments(user: User, args: string[], default_mode: Gamemode): TopPlayArguments {
    const topPlayArguments: TopPlayArguments = new TopPlayArguments;
    topPlayArguments.mode = default_mode;
    topPlayArguments.discordid = user.id;

    const handlers = buildHandlers();
    let mode: LegacyMode = LegacyMode.None;

    const usernameargs: string[] = [];

    args
        .map(arg => arg.toLowerCase())
        .forEach(arg => {
            if (handlers[arg]) {
                mode = handlers[arg]();
            } else {
                handleArgsByMode(topPlayArguments, mode, arg, usernameargs);
            }
        });

    const username = buildUsernameOfArgs(usernameargs);
    handleUsername(topPlayArguments, username);

    return topPlayArguments;
}

export function handleInteractionOptions(interaction: ChatInputCommandInteraction, default_mode: Gamemode) {

    const topPlayArguments: TopPlayArguments = new TopPlayArguments;

    const options = interaction.options;

    topPlayArguments.username = options.getString("username", false) === null ? undefined : options.getString("username", false)!;
    topPlayArguments.userid = options.getString("userid", false) === null ? undefined : options.getString("userid", false)!;
    topPlayArguments.discordid = options.getMember("discord") === null ? interaction.user.id : options.getMember("discord")!.toString();
    topPlayArguments.mode = (options.getString("mode", false) === null ? default_mode : options.getString("mode", false)!) as Gamemode;
    topPlayArguments.server = (options.getString("server", false) === null ? Server.BANCHO : options.getString("server", false)!.toUpperCase()) as Server;
    topPlayArguments.mods = options.getString("mods") === null ? [] : parseModString(options.getString("mods"));
    topPlayArguments.search = options.getString("query") === null ? "" : options.getString("query")!.toLowerCase()!;
    topPlayArguments.offset = options.getNumber("index") === null ? 0 : options.getNumber("index")! - 1;
    topPlayArguments.rank = options.getString("rank") === null ? undefined : options.getString("rank")!.toLowerCase()!;
    topPlayArguments.combo = options.getString("combo") === null ? undefined : options.getString("combo")!;
    topPlayArguments.accuracy = options.getString("accuracy") === null ? undefined : options.getString("accuracy")!;
    topPlayArguments.sort = options.getString("sort") === null ? "pp" : options.getString("sort")!.toLowerCase() as "acc" | "combo" | "length" | "pp" | undefined;
    topPlayArguments.reverse =  options.getString("reverse") === null ? false : options.getBoolean("reverse")!;

    if (topPlayArguments.discordid) {
        topPlayArguments.discordid = topPlayArguments.discordid.replace("<@", "").replace(">", "");
    }

    return topPlayArguments;

}

function handleArgsByMode(recentPlayArguments: TopPlayArguments, mode: LegacyMode, arg: string, usernameargs: string[]): void {
    switch (mode) {
        case LegacyMode.None:
            handleModeNone(recentPlayArguments, arg, usernameargs);
            break;
        case LegacyMode.Gamemode:
            recentPlayArguments.mode = arg as Gamemode;
            break;
        case LegacyMode.Search:
            recentPlayArguments.search += arg;
            break;
        case LegacyMode.Mods:
            recentPlayArguments.mods.push(arg);
            break;
        case LegacyMode.Rank:
            recentPlayArguments.rank += arg;
            break;
        case LegacyMode.Combo:
            recentPlayArguments.combo = arg;
            break;
            case LegacyMode.Accuracy:
                recentPlayArguments.accuracy = arg;
                break;
        case LegacyMode.Sort:
            recentPlayArguments.sort = arg as "acc" | "combo" | "length" | "pp" | undefined;
            break;
        case LegacyMode.Reverse:
            recentPlayArguments.reverse = arg === "true";
            break;
    }
}

function handleModeNone(recentPlayArguments: TopPlayArguments, arg: string, usernameargs: string[]): void {
    if (!isNaN(+arg) && +arg <= 50) {
        recentPlayArguments.offset = +arg;
    } else if (arg.startsWith("<@")) {
        recentPlayArguments.discordid = arg.replace("<@", "").replace(">", "");
    } else {
        usernameargs.push(arg);
    }
}

function handleUsername(recentPlayArguments: TopPlayArguments, username: string): void {
    if (username === undefined || username === "") {
        return;
    }

    if (isNaN(+username)) {
        recentPlayArguments.username = username;
    } else {
        recentPlayArguments.userid = username;
    }
}
