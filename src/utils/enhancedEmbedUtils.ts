// src/utils/enhancedEmbedUtils.ts
import { EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Tank, Player } from '../types/data';

/**
 * Väripaletti eri tilanteisiin
 */
export const Colors = {
    SUCCESS: 0x00D26A,      // Vihreä - onnistumiset
    ERROR: 0xF23F43,        // Punainen - virheet
    WARNING: 0xFFAE42,      // Oranssi - varoitukset
    INFO: 0x5865F2,         // Discord blurple - yleiset tiedot
    QUEUE: 0x3BA55D,        // Tummanvihreä - jono toiminnot
    TANK: 0x5865F2,         // Blurple - tankki toiminnot
    STATUS: 0x2B2D31,       // Tumma - status näkymät
    PREMIUM: 0xFFD700       // Kulta - erikoiset toiminnot
} as const;

/**
 * Emoji-ikonit eri käyttötarkoituksiin
 */
export const Icons = {
    SUCCESS: '✨',
    ERROR: '❌',
    WARNING: '⚠️',
    INFO: 'ℹ️',
    TANK: '🛡️',
    QUEUE: '📋',
    PLAYER: '👤',
    CROWN: '👑',
    FIRE: '🔥',
    ROCKET: '🚀',
    CELEBRATION: '🎉',
    LOADING: '⏳',
    EMPTY: '📭',
    FULL: '📬',
    CRY: '😭',
} as const;

/**
 * Luo footer teksti botin tietojen kanssa
 */
function createFooter(client?: { user?: { displayAvatarURL(): string } }) {
    return {
        text: '🎮 Lihabotti v1.0 • pumpers gonna pump',
        iconURL: client?.user?.displayAvatarURL() ?? undefined
    };
}

/**
 * Luo onnistumis-embed
 */
export function createSuccessEmbed(title: string, description: string): EmbedBuilder {
    return new EmbedBuilder()
        .setColor(Colors.SUCCESS)
        .setTitle(`${Icons.SUCCESS} ${title}`)
        .setDescription(description)
        .setTimestamp();
}

/**
 * Luo virhe-embed
 */
export function createErrorEmbed(title: string, description: string): EmbedBuilder {
    return new EmbedBuilder()
        .setColor(Colors.ERROR)
        .setTitle(`${Icons.ERROR} ${title}`)
        .setDescription(description)
        .setTimestamp();
}

/**
 * Luo tankki lisäys embed
 */
export function createTankAddedEmbed(tankName: string): EmbedBuilder {
    return new EmbedBuilder()
        .setColor(Colors.TANK)
        .setTitle(`Tankki lisätty`)
        .setDescription(`**${tankName}** on nyt valmis ottamaan pelaajia jonosta!`)
        .addFields(
            {
                name: ` `,
                value: '• Pelaajat voivat liittyä yhteiseen jonoon `/jono` komennolla\n• Käytä `/next` ottaaksesi seuraavan pelaajan\n• Seuraa tilannetta `/status` komennolla',
                inline: false
            }
        )
        .setThumbnail('https://cdn.discordapp.com/emojis/1234567890123456789.png') // Voit lisätä custom emojen
        .setTimestamp();
}

/**
 * Luo tankki poistettu embed
 */
export function createTankRemovedEmbed(tankName: string, queueCount: number): EmbedBuilder {
    const embed = new EmbedBuilder()
        .setColor(Colors.WARNING)
        .setTitle(`${Icons.WARNING} Tankki poistui palveluksesta`)
        .setDescription(`**${tankName}** on poistettu järjestelmästä.`)
        .setTimestamp();

    return embed;
}

/**
 * Luo tanks lista embed
 */
export function createTanksListEmbed(tanks: Tank[]): EmbedBuilder {
    const embed = new EmbedBuilder()
        .setColor(Colors.TANK)
        .setTitle(` Saatavilla olevat tankit`)
        .setTimestamp();

    if (tanks.length === 0) {
        embed
            .setDescription(`${Icons.EMPTY} **Ei tankkeja saatavilla!**\n\nLiity ensimmäisenä tankkien joukkoon käyttämällä \`/add-tank\` komentoa.`)
            .setColor(Colors.INFO);
        return embed;
    }

    const tankList = tanks.map((tank, index) => {
        const crown = index === 0 ? Icons.CROWN : Icons.TANK;
        const addedDate = tank.addedAt.toLocaleDateString('fi-FI');
        return `${crown} **${tank.displayName}**\n└ *Bringing the heat since ${addedDate}*`;
    }).join('\n\n');

    embed
        .setDescription(`${tankList}\n\n*Kaikki tankit jakavat yhteisen jonon!*`)

    return embed;
}

/**
 * Luo jonoon liittymis embed
 */
export function createJoinQueueEmbed(playerName: string, tankName: string, position: number): EmbedBuilder {
    const positionText = position === 1 ? 'Olet seuraavana!' : `Sijasi jonossa: **#${position}**`;
    
    return new EmbedBuilder()
        .setColor(Colors.QUEUE)
        .setTitle(`Liitytty jonoon!`)
        .addFields(
            {
                name: `Jonon tiedot`,
                value: positionText,
                inline: true
            },
            {
                name: `${Icons.LOADING} Arvioitu odotus`,
                value: position <= 1 ? '🟢 Pls' : position <= 3 ? '🟡 Oof' : '🔴 Vuosi',
                inline: true
            }
        )
        .setTimestamp();
}

/**
 * Luo seuraava pelaaja embed
 */
export function createNextPlayerEmbed(playerName: string, remainingCount: number, tankName: string): EmbedBuilder {
    return new EmbedBuilder()
        .setColor(Colors.SUCCESS)
        .setTitle(`Seuraava kusipää kutsuttu peleille!`)
        .addFields(
            {
                name: `Jonon tilanne`,
                value: `**${remainingCount}** pelaajaa jonossa`,
                inline: false
            },
        )
        .setTimestamp();
}

/**
 * Luo tyhjä jono embed
 */
export function createEmptyQueueEmbed(tankName: string): EmbedBuilder {
    return new EmbedBuilder()
        .setColor(Colors.WARNING)
        .setTitle(`Jono on tyhjä`)
        .setDescription(`Jono on tällä hetkellä tyhjä.`)
        .setTimestamp();
}

/**
 * Luo status embed näyttämään yhteisen jonon ja tankkien tilanne
 */
export function createStatusEmbed(
    status: { tanks: Tank[]; queue: { players: Player[] }; totalPlayers: number },
    client?: { user?: { displayAvatarURL(): string } }
): EmbedBuilder {
    const embed = new EmbedBuilder()
        .setColor(Colors.STATUS)
        .setTitle(`Kaken m+ lista`)
        .setFooter(createFooter(client))
        .setTimestamp();

    if (status.tanks.length === 0) {
        embed
            .setDescription(`${Icons.EMPTY} **Ei tankkeja palveluksessa!**\n\nLisää itsesi tankiksi komennolla \`/add-tank\``)
            .setColor(Colors.INFO);
        return embed;
    }

    // Tankkien lista
    const tankList = status.tanks.map((tank, index) => {
        const crown = index === 0 ? Icons.CROWN : Icons.TANK;
        return `${crown} ${tank.displayName}`;
    }).join('\n');

    embed.setDescription(`**Saatavilla olevat tankit:**\n${tankList}\n\n**Jono:**`);

    // Yhteisen jonon tilanne
    const queueList = status.queue.players.length > 0
        ? status.queue.players.slice(0, 15).map((p, i) => {
            const position = i + 1;
            const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `${position}.`;
            return `${medal} ${p.name}`;
        }).join('\n') + (status.queue.players.length > 15 ? `\n... ja ${status.queue.players.length - 15} muuta` : '')
        : 'Dead game...';

    const statusIcon = status.totalPlayers === 0 ? Icons.CRY : 
                      status.totalPlayers >= 10 ? Icons.FIRE : Icons.SUCCESS;

    embed.addFields({
        name: `${statusIcon} = ${status.totalPlayers} pelaajaa`,
        value: `\`\`\`${queueList}\`\`\``,
        inline: false
    });

    return embed;
}

/**
 * Luo jonosta poistumis embed
 */
export function createLeaveQueueEmbed(playerName: string, tankName: string): EmbedBuilder {
    return new EmbedBuilder()
        .setColor(Colors.WARNING)
        .setTitle(`${Icons.WARNING} Poistuit jonosta`)
        .setDescription(`**${playerName}** poistui jonosta.`)
        .setFooter(createFooter())
        .setTimestamp();
}

/**
 * Luo jonon tyhjennys embed
 */
export function createClearQueueEmbed(tankName: string, clearedCount: number): EmbedBuilder {
    return new EmbedBuilder()
        .setColor(Colors.SUCCESS)
        .setTitle(`${Icons.SUCCESS} Jono tyhjennetty!`)
        .addFields({
            name: ``,
            value: `${clearedCount} pelaajaa poistettiin jonosta.`,
            inline: false
        })
        .setTimestamp();
}

/**
 * Lähettää embed-viestin vastauksena interaktioon (päivitetty versio)
 */
export function replyWithEmbed(
    interaction: ChatInputCommandInteraction,
    embed: EmbedBuilder,
    ephemeral: boolean = false
): Promise<any> {
    return interaction.reply({
        embeds: [embed],
        ephemeral
    });
}