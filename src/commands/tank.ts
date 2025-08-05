// src/commands/tank.ts
import { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction } from 'discord.js';
import { CommandHandler } from '../types/command';
import { DataManager } from '../utils/dataManager';
import { 
    createTankAddedEmbed, 
    createTankRemovedEmbed, 
    createTanksListEmbed,
    createErrorEmbed,
    replyWithEmbed 
} from '../utils/enhancedEmbedUtils';

/**
 * Lisää uuden tankin järjestelmään
 */
export const addTankCommand: CommandHandler = {
    name: 'add-tank',
    data: new SlashCommandBuilder()
        .setName('add-tank')
        .setDescription('Lisää itsesi tankiksi')
        .addStringOption(option =>
            option.setName('nimi')
                .setDescription('Tankin näyttönimi (esim. "Kake")')
                .setRequired(true)
        ),

    async execute(interaction: ChatInputCommandInteraction, dataManager: DataManager) {
        const tankName = interaction.options.getString('nimi')!;
        const result = dataManager.addTank(interaction.user.id, tankName, tankName);

        if (result.success) {
            const embed = createTankAddedEmbed(tankName);
            await replyWithEmbed(interaction, embed, true);
        } else {
            const embed = createErrorEmbed('Tankin lisääminen epäonnistui', result.message);
            await replyWithEmbed(interaction, embed, true);
        }
    }
};

/**
 * Poistaa käyttäjän tankin
 */
export const removeTankCommand: CommandHandler = {
    name: 'remove-tank',
    data: new SlashCommandBuilder()
        .setName('remove-tank')
        .setDescription('Poista oma tankkisi')
        .addStringOption(option =>
            option.setName('nimi')
                .setDescription('Poistettavan tankin nimi')
                .setRequired(true)
                .setAutocomplete(true)
        ),

    async execute(interaction: ChatInputCommandInteraction, dataManager: DataManager) {
        const tankName = interaction.options.getString('nimi')!;
        const tank = dataManager.getTankByKey(tankName);
        
        const result = dataManager.removeTank(interaction.user.id, tankName);

        if (result.success && tank) {
            const embed = createTankRemovedEmbed(tank.displayName, 0); // Ei enää yksittäisiä jonoja
            await replyWithEmbed(interaction, embed, true);
        } else {
            const embed = createErrorEmbed('Tankin poistaminen epäonnistui', result.message);
            await replyWithEmbed(interaction, embed, true);
        }
    },

    async autocomplete(interaction: AutocompleteInteraction, dataManager: DataManager) {
        const focusedOption = interaction.options.getFocused();
        const userTanks = dataManager.getTanks().filter(tank => tank.id === interaction.user.id);

        const filtered = userTanks
            .filter(tank => tank.displayName.toLowerCase().includes(focusedOption.toLowerCase()))
            .map(tank => ({ name: tank.displayName, value: tank.name }));

        await interaction.respond(filtered.slice(0, 25));
    }
};

/**
 * Näyttää kaikki saatavilla olevat tankit
 */
export const tanksCommand: CommandHandler = {
    name: 'tanks',
    data: new SlashCommandBuilder()
        .setName('tanks')
        .setDescription('Näytä kaikki saatavilla olevat tankit'),

    async execute(interaction: ChatInputCommandInteraction, dataManager: DataManager) {
        const tanks = dataManager.getTanks();
        const embed = createTanksListEmbed(tanks);
        await replyWithEmbed(interaction, embed, true);
    }
};