// src/types/command.ts
import { ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandOptionsOnlyBuilder, AutocompleteInteraction, Client } from 'discord.js';
import { DataManager } from '../utils/dataManager';

/**
 * Komennon käsittelijän perusrakenne
 */
export interface CommandHandler {
    /** Komennon nimi */
    name: string;
    
    /** Slash command rakenne */
    data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
    
    /** 
     * Suorittaa komennon
     * @param interaction Discord interaktio
     * @param dataManager Tietojen hallinta
     */
    execute(interaction: ChatInputCommandInteraction, dataManager: DataManager, client?: Client): Promise<void>;
    
    /**
     * Käsittelee autocompletion (valinnainen)
     * @param interaction Autocomplete interaktio
     * @param dataManager Tietojen hallinta
     */
    autocomplete?(interaction: AutocompleteInteraction, dataManager: DataManager): Promise<void>;
}