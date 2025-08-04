// src/commands/status.ts
import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { CommandHandler } from '../types/command';
import { DataManager } from '../utils/dataManager';
import { createStatusEmbed, replyWithEmbed } from '../utils/enhancedEmbedUtils';

/**
 * Näyttää kaikkien tankkien jonojen tilanteen
 */
export const statusCommand: CommandHandler = {
    name: 'status',
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Näytä jonojen tilanne'),

    async execute(interaction: ChatInputCommandInteraction, dataManager: DataManager) {
        const status = dataManager.getStatus();
        const statusEmbed = createStatusEmbed(status, interaction.client);
        await replyWithEmbed(interaction, statusEmbed, true);
    }
};
// .displayName} ( ${queue.players.length} )`,
//             value: `\`\`\`\n${queueList}\n\`\`\``,
//             inline: true
//         });
//     });

//     return embed;
// }

// /**
//  * Näyttää kaikkien tankkien jonojen tilanteen
//  */
// export const statusCommand: CommandHandler = {
//     name: 'status',
//     data: new SlashCommandBuilder()
//         .setName('status')
//         .setDescription('Näytä jonojen tilanne'),

//     async execute(interaction: ChatInputCommandInteraction, dataManager: DataManager) {
//         const statusEmbed = createStatusEmbed(dataManager, interaction.client.user);
//         await replyWithEmbed(interaction, statusEmbed, true);
//     }
// };
