import { EmbedBuilder } from "discord.js";
import { buildBeatmapStats } from "../../api/utility/beatmap";
import { replaceDots, round } from "../../api/utility/comma";
import { calculateFcAcc } from "../../api/utility/stats";
import { RecentEmbedParameters } from "../recent";
import { rank_icons } from "../../utility/icons";
import { displayFruits, statistics } from "../../interfaces/osu/score/osuScore";

export function ctbFields(param: RecentEmbedParameters, embed: EmbedBuilder) {

    const score = param.score.score!;
    const map = param.score.beatmap!;
    const progress = param.progress;
    const appliedmods = param.appliedmods;
    const performacne = param.score.performance!;
    const fcAcc = calculateFcAcc(score, param.total_objects);

    // Play data
    // @ts-ignore
    const rankEmote: string = rank_icons[score?.rank];
    const fcStatistic: statistics = score.statistics;


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
            value: `**${score.max_combo}x**/${map.max_combo}x`,
            inline: true
        },
        {
            name: 'Hits',
            value: `${displayFruits(score.statistics)}`,
            inline: true
        },
        {
            name: 'PP if FC',
            value: `**${round(performacne.simulatedFc)}**/${round(performacne.accSS)}PP`,
            inline: true
        },
        {
            name: 'Acc',
            value: `${replaceDots(round(fcAcc))}%`,
            inline: true
        },
        {
            name: 'Hits',
            value: `${displayFruits(score.maximum_statistics)}`,
            inline: true
        },
        {
            name: `Map Info`,
            value: `Length: \`${param.stats.min}:${param.stats.strSec}\` (\`${param.stats.dmin}:${param.stats.strDsec}\`) BPM: \`${param.stats.bpm}\` Objects: \`${param.total_objects}\`\n ${buildBeatmapStats(param.stats, performacne.difficulty)}`,
            inline: true
        },
    ])

    return embed;
}

export function ctbCompact(param: RecentEmbedParameters, embed: EmbedBuilder) {

    const score = param.score.score!;
    const map = param.score.beatmap!;
    const progress = param.progress;
    const appliedmods = param.appliedmods;
    const performacne = param.score.performance!;

    // Play data
    // @ts-ignore
    const rankEmote: string = rank_icons[score?.rank];

    const currentTimeInSeconds = Math.floor(new Date(score.ended_at).getTime() / 1000)

    embed.setFields(
        {
            name: `**${rankEmote} ${progress} ${appliedmods == "+" ? "" : appliedmods}**    ${replaceDots(score.total_score)}    (${replaceDots((score.accuracy * 100).toFixed(2))}%)\nMap attempted <t:${currentTimeInSeconds}:R>`,
            value: `**${round(performacne.simulated)}**/${round(performacne.accSS)}pp  [**${score.max_combo}x**/${map.max_combo}x]  ${displayFruits(score.statistics)}`,
            inline: true
        });

    return embed;
}