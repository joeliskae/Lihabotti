// src/bot.ts
import 'dotenv/config';
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { DataManager } from './utils/dataManager';
import { loadCommands, getCommandData } from './utils/commandLoader';
import { CommandHandler } from './types/command';

/**
 * Discord bot client konfiguraatio
 */
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
    ],
});

/**
 * Tietojen hallinta instanssi
 */
const dataManager = new DataManager();

/**
 * Komentojen Collection
 */
const commands: Collection<string, CommandHandler> = loadCommands();

/**
 * Bot ready event käsittelijä
 * Rekisteröi slash komennot sekä globaalisti että guildeihin
 */
client.once('ready', async () => {
    console.log(`Logged in as ${client.user?.tag}!`);
    console.log(`Bot ID: ${client.user?.id}`);

    const commandData = getCommandData(commands);

    try {
        console.log('Started refreshing application (/) commands.');

        // Globaalit komennot otettu pois käytöstä
        // const result = await client.application?.commands.set(commandData);
        // console.log(`Successfully registered ${result?.size} commands globally.`);
        // console.log('Command names:', result?.map(cmd => cmd.name).join(', '));
    } catch (error) {
        console.error('Error registering global commands:', error);
    }

    try {
        const guild = client.guilds.cache.first();
        if (guild) {
            console.log(`Registering commands to guild: ${guild.name}`);
            const guildResult = await guild.commands.set(commandData);
            console.log(`Successfully registered ${guildResult.size} commands to guild.`);
        }
    } catch (error) {
        console.error('Error registering guild commands:', error);
    }
});

/**
 * Interaktioiden käsittelijä
 * Ohjaa autocomplete ja chat input komennot oikeille käsittelijöille
 */
client.on('interactionCreate', async interaction => {
    // Käsittele autocomplete interaktiot
    if (interaction.isAutocomplete()) {
        const command = commands.get(interaction.commandName);
        
        if (!command || !command.autocomplete) {
            console.error(`No autocomplete handler found for command ${interaction.commandName}`);
            return;
        }

        try {
            await command.autocomplete(interaction, dataManager);
        } catch (error) {
            console.error(`Error handling autocomplete for ${interaction.commandName}:`, error);
        }
        return;
    }

    // Käsittele chat input komennot
    if (interaction.isChatInputCommand()) {
        const command = commands.get(interaction.commandName);
        
        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.execute(interaction, dataManager);
        } catch (error) {
            console.error(`Error executing command ${interaction.commandName}:`, error);
            
            // Yritä lähettää virheilmoitus käyttäjälle
            const errorMessage = {
                content: 'Tapahtui virhe komennon suorittamisessa!',
                ephemeral: true
            };

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        }
    }
});

/**
 * Käynnistä bot
 */
const token = process.env.DISCORD_TOKEN;
if (!token) {
    console.error('DISCORD_TOKEN not found in environment variables!');
    process.exit(1);
}

console.log('Starting Lihabotti v1.0...');
client.login(token);