// src/commands/queue.ts
import { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction } from 'discord.js';
import { CommandHandler } from '../types/command';
import { DataManager } from '../utils/dataManager';
import { 
    createJoinQueueEmbed,
    createNextPlayerEmbed,
    createEmptyQueueEmbed,
    createLeaveQueueEmbed,
    createClearQueueEmbed,
    createErrorEmbed,
    replyWithEmbed 
} from '../utils/enhancedEmbedUtils';
import { sendChannelAndUserMessage } from '../utils/sendMessage';

/**
 * Liittää pelaajan tankin jonoon
 */
export const jonoCommand: CommandHandler = {
    name: 'jono',
    data: new SlashCommandBuilder()
        .setName('jono')
        .setDescription('Liity jonoon')
        .addStringOption(option =>
            option.setName('tankki')
                .setDescription('Kenen tankin jonoon haluat?')
                .setRequired(true)
                .setAutocomplete(true)
        ),

    async execute(interaction: ChatInputCommandInteraction, dataManager: DataManager) {
        const tankKey = interaction.options.getString('tankki')!;
        const result = dataManager.joinQueue(tankKey, interaction.user.id, interaction.user.displayName);

        if (result.success && result.player) {
            const tank = dataManager.getTankByKey(tankKey);
            const queueLength = dataManager.getQueueLength(tankKey);
            
            if (tank) {
                const embed = createJoinQueueEmbed(result.player.name, tank.displayName, queueLength);
                await replyWithEmbed(interaction, embed, true);
            }
        } else {
            const embed = createErrorEmbed('Jonoon liittyminen epäonnistui', result.message);
            await replyWithEmbed(interaction, embed, true);
        }
    },

    async autocomplete(interaction: AutocompleteInteraction, dataManager: DataManager) {
        const focusedOption = interaction.options.getFocused();
        const tankChoices = dataManager.getTankChoices();

        const filtered = tankChoices.filter(choice =>
            choice.name.toLowerCase().includes(focusedOption.toLowerCase())
        );

        await interaction.respond(filtered.slice(0, 25));
    }
};

/**
 * Ottaa seuraavan pelaajan omasta jonosta (vain tankin omistajalle)
 */
export const nextCommand: CommandHandler = {
    name: 'next',
    data: new SlashCommandBuilder()
        .setName('next')
        .setDescription('Ota seuraava pelaaja omasta jonostasi'),

    async execute(interaction: ChatInputCommandInteraction, dataManager: DataManager) {
        // Etsi käyttäjän oma tankki
        const userTank = dataManager.getUserTank(interaction.user.id);
        
        if (!userTank) {
            const embed = createErrorEmbed('Ei tankkia', 'Sinulla ei ole tankkia! Lisää itsesi tankiksi komennolla `/add-tank`');
            await replyWithEmbed(interaction, embed, true);
            return;
        }

        const result = dataManager.getNext(userTank.name);

        if (result.success && result.player) {
            const remainingCount = dataManager.getQueueLength(userTank.name);
            const embed = createNextPlayerEmbed(result.player.name, remainingCount, userTank.displayName);
            await replyWithEmbed(interaction, embed, true);
            
            const content = `Pelaamaan saatana!! \n t: ${userTank.name}`;
            await sendChannelAndUserMessage(interaction, result.player, content);
        } else {
            const embed = createEmptyQueueEmbed(userTank.displayName);
            await replyWithEmbed(interaction, embed, true);
        }
    }
};

/**
 * Poistaa pelaajan jonosta
 */
export const leaveCommand: CommandHandler = {
    name: 'leave',
    data: new SlashCommandBuilder()
        .setName('leave')
        .setDescription('Poistu jonosta')
        .addStringOption(option =>
            option.setName('tankki')
                .setDescription('Mistä jonosta poistu?')
                .setRequired(true)
                .setAutocomplete(true)
        ),

    async execute(interaction: ChatInputCommandInteraction, dataManager: DataManager) {
        const tankKey = interaction.options.getString('tankki')!;
        const result = dataManager.leaveQueue(tankKey, interaction.user.id);

        if (result.success) {
            const tank = dataManager.getTankByKey(tankKey);
            if (tank) {
                const embed = createLeaveQueueEmbed(interaction.user.displayName, tank.displayName);
                await replyWithEmbed(interaction, embed, true);
            }
        } else {
            const embed = createErrorEmbed('Jonosta poistuminen epäonnistui', result.message);
            await replyWithEmbed(interaction, embed, true);
        }
    },

    async autocomplete(interaction: AutocompleteInteraction, dataManager: DataManager) {
        const focusedOption = interaction.options.getFocused();
        const tankChoices = dataManager.getTankChoices();

        const filtered = tankChoices.filter(choice =>
            choice.name.toLowerCase().includes(focusedOption.toLowerCase())
        );

        await interaction.respond(filtered.slice(0, 25));
    }
};

/**
 * Tyhjentää tankin jonon (vain tankin omistajalle)
 */
export const clearCommand: CommandHandler = {
    name: 'clear',
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Tyhjennä oma jonosi'),

    async execute(interaction: ChatInputCommandInteraction, dataManager: DataManager) {
        // Etsi käyttäjän oma tankki
        const userTank = dataManager.getUserTank(interaction.user.id);
        
        if (!userTank) {
            const embed = createErrorEmbed('Ei tankkia', 'Sinulla ei ole tankkia! Lisää itsesi tankiksi komennolla `/add-tank`');
            await replyWithEmbed(interaction, embed, true);
            return;
        }

        const queueLength = dataManager.getQueueLength(userTank.name);
        const result = dataManager.clearQueue(userTank.name);

        if (result.success) {
            const embed = createClearQueueEmbed(userTank.displayName, queueLength);
            await replyWithEmbed(interaction, embed);
        } else {
            const embed = createErrorEmbed('Jonon tyhjentäminen epäonnistui', result.message);
            await replyWithEmbed(interaction, embed, true);
        }
    }
};