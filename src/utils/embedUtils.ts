// src/utils/embedUtils.ts
import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

/**
 * Lähettää embed-viestin vastauksena interaktioon
 * @param interaction Discord chat input command interaktio
 * @param embed EmbedBuilder instanssi lähetettäväksi
 * @param ephemeral Onko viesti vain käyttäjälle näkyvä (oletus: false)
 * @returns Promise joka resolvoituu kun viesti on lähetetty
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