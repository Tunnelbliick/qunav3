import { EmbedBuilder } from "discord.js";
import { replaceDots, round } from "../../api/utility/comma";
import { RecentEmbedParameters } from "../recent";
import { buildBeatmapStats } from "../../api/utility/beatmap";
import { rank_icons } from "../../utility/icons";

export function maniaFields(param: RecentEmbedParameters, embed: EmbedBuilder) {

    const score = param.score.score!;
    const progress = param.progress;
    const appliedmods = param.appliedmods;
    const performacne = param.score.performance!;

    // Play data
    // @ts-ignore
    const rankEmote: string = rank_icons[score?.rank];

    embed.addFields([
        {
            name: `Grade`,
            value: `**${rankEmote}** ${progress} ${appliedmods == "+" ? "" : appliedmods}`,
            inline: true
        },
        {
            name: `Score`,
            value: `${replaceDots(score.total_score)}`,
            inline: true
        },
        {
            name: 'Acc',
            value: `${replaceDots(round(score.accuracy * 100))}%`,
            inline: true
        },
        {
            name: 'PP',
            value: `**${round(performacne.simulated)}**/${round(performacne.accSS)}PP`,
            inline: true
        },
        {
            name: 'Combo',
            value: `**${score.max_combo}x**`,
            inline: true
        },
        {
            name: 'Hits',
            value: `{${score.statistics.geki}/${score.statistics.great}/${score.statistics.katu}/${score.statistics.ok}/${score.statistics.meh}/${score.statistics.miss}}`,
            inline: true
        },
        {
            name: `Map Info`,
            value: `Length: \`${param.stats.min}:${param.stats.strSec}\` (\`${param.stats.dmin}:${param.stats.strDsec}\`) BPM: \`${param.stats.bpm}\` Objects: \`${param.total_objects}\`\n ${buildBeatmapStats(param.stats, performacne.difficulty)}`,
            inline: true
        },
    ]);

    return embed;
}

export function maniaCompact(param: RecentEmbedParameters, embed: EmbedBuilder) {

    const score = param.score.score!;
    const progress = param.progress;
    const appliedmods = param.appliedmods;
    const performacne = param.score.performance!;

    // Play data
    // @ts-ignore
    const rankEmote: string = rank_icons[score?.rank];

    const currentTimeInSeconds = Math.floor(new Date(score.ended_at).getTime() / 1000)

    embed.setFields(
        {
            name: `**${rankEmote} ${progress} ${appliedmods == "+" ? "" : appliedmods}**    ${replaceDots(score.total_score)}    (${replaceDots(round(score.accuracy * 100))}%)\nMap attempted <t:${currentTimeInSeconds}:R>`,
            value: `**${round(performacne.simulated)}**/${round(performacne.accSS)}pp  [ **${score.max_combo}x** ]  {${score.statistics.geki}/${score.statistics.great}/${score.statistics.katu}/${score.statistics.ok}/${score.statistics.meh}/${score.statistics.miss}}`,
            inline: true
        });

    return embed;
}