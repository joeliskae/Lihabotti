// src/commands/status.ts
import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { CommandHandler } from '../types/command';
import { DataManager } from '../utils/dataManager';
import { createStatusEmbed, replyWithEmbed } from '../utils/enhancedEmbedUtils';

/**
 * Näyttää yhteisen jonon ja kaikkien tankkien tilanteen
 */
export const statusCommand: CommandHandler = {
    name: 'status',
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Näytä jonon ja tankkien tilanne'),

    async execute(interaction: ChatInputCommandInteraction, dataManager: DataManager) {
        const status = dataManager.getStatus();
        const statusEmbed = createStatusEmbed(status, interaction.client);
        await replyWithEmbed(interaction, statusEmbed, true);
    }
};