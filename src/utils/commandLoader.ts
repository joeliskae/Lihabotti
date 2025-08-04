// src/utils/commandLoader.ts
import { Collection } from 'discord.js';
import { CommandHandler } from '../types/command';

// Importit kaikista komennoista
import { addTankCommand, removeTankCommand, tanksCommand } from '../commands/tank';
import { jonoCommand, nextCommand, leaveCommand, clearCommand } from '../commands/queue';
import { statusCommand } from '../commands/status';

/**
 * Lataa ja palauttaa kaikki saatavilla olevat komennot
 * @returns Collection joka sisältää kaikki komennot
 */
export function loadCommands(): Collection<string, CommandHandler> {
    const commands = new Collection<string, CommandHandler>();

    // Tankki komennot
    commands.set(addTankCommand.name, addTankCommand);
    commands.set(removeTankCommand.name, removeTankCommand);
    commands.set(tanksCommand.name, tanksCommand);

    // Jono komennot
    commands.set(jonoCommand.name, jonoCommand);
    commands.set(nextCommand.name, nextCommand);
    commands.set(leaveCommand.name, leaveCommand);
    commands.set(clearCommand.name, clearCommand);

    // Status komennot
    commands.set(statusCommand.name, statusCommand);

    console.log(`Loaded ${commands.size} commands: ${commands.map(cmd => cmd.name).join(', ')}`);
    return commands;
}

/**
 * Palauttaa kaikki komennot SlashCommandBuilder muodossa rekisteröintiä varten
 * @param commands Collection komennoista
 * @returns Array SlashCommandBuilder objekteja
 */
export function getCommandData(commands: Collection<string, CommandHandler>) {
    return commands.map(command => command.data);
}