// src/commands/queue.ts
import { SlashCommandBuilder, ChatInputCommandInteraction, Client } from 'discord.js';
import { CommandHandler } from '../types/command';
import { DataManager } from '../utils/dataManager';
import { 
    createJoinQueueEmbed,
    createNextPlayerEmbed,
    createEmptyQueueEmbed,
    createLeaveQueueEmbed,
    createClearQueueEmbed,
    createErrorEmbed
} from '../utils/enhancedEmbedUtils';
import { sendChannelAndUserMessage } from '../utils/sendMessage';
import { updateChannelTopic } from '../utils/updateTopic';

/**
 * Liittää pelaajan yhteiseen jonoon
 */
export const jonoCommand: CommandHandler = {
    name: 'jono',
    data: new SlashCommandBuilder()
        .setName('jono')
        .setDescription('Liity jonoon'),

    async execute(interaction: ChatInputCommandInteraction, dataManager: DataManager, client: Client) {
        // DEFER response heti alkuun - estää timeout erroreita
        await interaction.deferReply({ ephemeral: true });
        
        const result = dataManager.joinQueue(interaction.user.id, interaction.user.displayName);

        if (result.success && result.player && result.position) {
            const embed = createJoinQueueEmbed(result.player.name, "jono", result.position);
            await interaction.followUp({ embeds: [embed] });
            await updateChannelTopic(client, dataManager.getQueueLength());
        } else {
            const embed = createErrorEmbed('Jonoon liittyminen epäonnistui', result.message);
            await interaction.followUp({ embeds: [embed] });
        }
    }
};

/**
 * Ottaa seuraavan pelaajan yhteisestä jonosta (vain tankeille) /next
 */
export const nextCommand: CommandHandler = {
    name: 'next',
    data: new SlashCommandBuilder()
        .setName('next')
        .setDescription('Ota seuraava pelaaja jonosta (vain tankeille)'),

    async execute(interaction: ChatInputCommandInteraction, dataManager: DataManager, client: Client) {
        // DEFER response heti alkuun
        await interaction.deferReply({ ephemeral: true });
        
        const result = dataManager.getNext(interaction.user.id);

        if (result.success && result.player) {
            const userTank = dataManager.getUserTank(interaction.user.id);
            const remainingCount = dataManager.getQueueLength();
            const embed = createNextPlayerEmbed(result.player.name, remainingCount, userTank?.displayName || 'Tankki');
            await interaction.followUp({ embeds: [embed] });
            
            const content = `Pelaamaan saatana!! \n -- ${userTank?.displayName || 'Salatankki'}`;
            await sendChannelAndUserMessage(interaction, result.player, content);
            await updateChannelTopic(client, dataManager.getQueueLength());
        } else {
            const embed = result.message.includes('Vain tankit') 
                ? createErrorEmbed('Ei käyttöoikeutta', result.message)
                : createEmptyQueueEmbed('jono');
            await interaction.followUp({ embeds: [embed] });
        }
    }
};

/**
 * Poistaa pelaajan yhteisestä jonosta
 */
export const leaveCommand: CommandHandler = {
    name: 'leave',
    data: new SlashCommandBuilder()
        .setName('leave')
        .setDescription('Poistu jonosta'),

    async execute(interaction: ChatInputCommandInteraction, dataManager: DataManager, client: Client) {
        // DEFER response heti alkuun
        await interaction.deferReply({ ephemeral: true });
        
        const result = dataManager.leaveQueue(interaction.user.id);

        if (result.success) {
            const embed = createLeaveQueueEmbed(interaction.user.displayName, "jono");
            await interaction.followUp({ embeds: [embed] });
            await updateChannelTopic(client, dataManager.getQueueLength());
        } else {
            const embed = createErrorEmbed('Jonosta poistuminen epäonnistui', result.message);
            await interaction.followUp({ embeds: [embed] });
        }
    }
};

/**
 * Tyhjentää yhteisen jonon (vain tankeille)
 */
export const clearCommand: CommandHandler = {
    name: 'clear',
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Tyhjennä jono (vain tankeille)'),

    async execute(interaction: ChatInputCommandInteraction, dataManager: DataManager, client: Client) {
        // DEFER response heti alkuun
        await interaction.deferReply({ ephemeral: true });
        
        const queueLength = dataManager.getQueueLength();
        const result = dataManager.clearQueue(interaction.user.id);

        if (result.success) {
            const embed = createClearQueueEmbed("Jono", queueLength);
            await interaction.followUp({ embeds: [embed] });
            await updateChannelTopic(client, dataManager.getQueueLength());
        } else {
            const embed = createErrorEmbed('Jonon tyhjentäminen epäonnistui', result.message);
            await interaction.followUp({ embeds: [embed] });
        }
    }
};