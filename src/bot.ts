// src/bot.ts
import 'dotenv/config';
import { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, AutocompleteInteraction, ChatInputCommandInteraction } from 'discord.js';
import { DataManager } from './utils/dataManager';
import { sendChannelAndUserMessage } from './utils/sendMessage';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
    ],
});

const dataManager = new DataManager();

// Base Slash Commands (tank choices will be added dynamically)
const baseCommands = [
    new SlashCommandBuilder()
        .setName('add-tank')
        .setDescription('Lisää itsesi tankiksi')
        .addStringOption(option =>
            option.setName('nimi')
                .setDescription('Tankin näyttönimi (esim. "Kake")')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('remove-tank')
        .setDescription('Poista oma tankkisi')
        .addStringOption(option =>
            option.setName('nimi')
                .setDescription('Poistettavan tankin nimi')
                .setRequired(true)
                .setAutocomplete(true)
        ),

    new SlashCommandBuilder()
        .setName('tanks')
        .setDescription('Näytä kaikki saatavilla olevat tankit'),

    new SlashCommandBuilder()
        .setName('jono')
        .setDescription('Liity jonoon')
        .addStringOption(option =>
            option.setName('tankki')
                .setDescription('Kenen tankin jonoon haluat?')
                .setRequired(true)
                .setAutocomplete(true)
        ),

    new SlashCommandBuilder()
        .setName('next')
        .setDescription('Ota seuraava pelaaja jonosta (vain tankin omistajalle)')
        .addStringOption(option =>
            option.setName('tankki')
                .setDescription('Kenen jonosta otetaan?')
                .setRequired(true)
                .setAutocomplete(true)
        ),

    new SlashCommandBuilder()
        .setName('status')
        .setDescription('Näytä jonojen tilanne'),

    new SlashCommandBuilder()
        .setName('leave')
        .setDescription('Poistu jonosta')
        .addStringOption(option =>
            option.setName('tankki')
                .setDescription('Mistä jonosta poistu?')
                .setRequired(true)
                .setAutocomplete(true)
        ),

    new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Tyhjennä jono (vain tankin omistajalle)')
        .addStringOption(option =>
            option.setName('tankki')
                .setDescription('Minkä jonon tyhjennetään?')
                .setRequired(true)
                .setAutocomplete(true)
        ),
];

client.once('ready', async () => {
    console.log(`Logged in as ${client.user?.tag}!`);
    console.log(`Bot ID: ${client.user?.id}`);

    try {
        console.log('Started refreshing application (/) commands.');
        const result = await client.application?.commands.set(baseCommands);
        console.log(`Successfully registered ${result?.size} commands globally.`);
        console.log('Command names:', result?.map(cmd => cmd.name).join(', '));
    } catch (error) {
        console.error('Error registering global commands:', error);
    }

    try {
        const guild = client.guilds.cache.first();
        if (guild) {
            console.log(`Registering commands to guild: ${guild.name}`);
            const guildResult = await guild.commands.set(baseCommands);
            console.log(`Successfully registered ${guildResult.size} commands to guild.`);
        }
    } catch (error) {
        console.error('Error registering guild commands:', error);
    }
});

client.on('interactionCreate', async interaction => {
    if (interaction.isAutocomplete()) {
        await handleAutocomplete(interaction);
    }
});

async function handleAutocomplete(interaction: AutocompleteInteraction) {
    const { commandName, options } = interaction;

    if (['jono', 'next', 'leave', 'clear'].includes(commandName)) {
        const focusedOption = options.getFocused();
        const tankChoices = dataManager.getTankChoices();

        const filtered = tankChoices.filter(choice =>
            choice.name.toLowerCase().includes(focusedOption.toLowerCase())
        );

        await interaction.respond(filtered.slice(0, 25));
    } else if (commandName === 'remove-tank') {
        const focusedOption = options.getFocused();
        const userTanks = dataManager.getTanks().filter(tank => tank.id === interaction.user.id);

        const filtered = userTanks
            .filter(tank => tank.displayName.toLowerCase().includes(focusedOption.toLowerCase()))
            .map(tank => ({ name: tank.displayName, value: tank.name }));

        await interaction.respond(filtered.slice(0, 25));
    }
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, user } = interaction;

    try {
        switch (commandName) {
            case 'add-tank': {
                const tankName = interaction.options.getString('nimi')!;
                const result = dataManager.addTank(user.id, tankName, tankName);

                const embed = new EmbedBuilder()
                    .setColor(result.success ? 0x00ff00 : 0xff0000)
                    .setTitle(result.success ? '✅ Tankki lisätty!' : '❌ Virhe')
                    .setDescription(result.message)
                    .setTimestamp();

                await replyWithEmbed(interaction, embed, true);
                break;
            }

            case 'remove-tank': {
                const tankName = interaction.options.getString('nimi')!;
                const result = dataManager.removeTank(user.id, tankName);

                const embed = new EmbedBuilder()
                    .setColor(result.success ? 0x00ff00 : 0xff0000)
                    .setTitle(result.success ? '✅ Tankki poistettu!' : '❌ Virhe')
                    .setDescription(result.message)
                    .setTimestamp();

                await replyWithEmbed(interaction, embed, true);
                break;
            }

            case 'tanks': {
                const tanks = dataManager.getTanks();

                const embed = new EmbedBuilder()
                    .setColor(0x0099ff)
                    .setTitle('🛡️ Saatavilla olevat tankit')
                    .setTimestamp();

                if (tanks.length === 0) {
                    embed.setDescription('Ei tankkeja saatavilla! Lisää itsesi tankiksi komennolla `/add-tank`');
                } else {
                    const tankList = tanks.map(tank =>
                        `**${tank.displayName}** (lisätty ${tank.addedAt.toLocaleDateString('fi-FI')})`
                    ).join('\n');
                    embed.setDescription(tankList);
                }

                await replyWithEmbed(interaction, embed, true);
                break;
            }

            case 'jono': {
                const tankKey = interaction.options.getString('tankki')!;
                const result = dataManager.joinQueue(tankKey, user.id, user.displayName);

                const embed = new EmbedBuilder()
                    .setColor(result.success ? 0x00ff00 : 0xff0000)
                    .setTitle(result.success ? '✅ Liitytty jonoon!' : '❌ Virhe')
                    .setDescription(result.message)
                    .setTimestamp();

                await replyWithEmbed(interaction, embed, true);
                break;
            }

            case 'next': {
                const tankKey = interaction.options.getString('tankki')!;

                if (!dataManager.isTankOwner(user.id, tankKey)) {
                    const embed = new EmbedBuilder()
                        .setColor(0xff0000)
                        .setTitle('❌ Ei oikeuksia')
                        .setDescription('Voit ottaa pelaajia vain oman tankkisi jonosta!')
                        .setTimestamp();

                    await replyWithEmbed(interaction, embed, true);
                    break;
                }

                const result = dataManager.getNext(tankKey);

                const embed = new EmbedBuilder()
                    .setColor(result.success ? 0x00ff00 : 0xff6600)
                    .setTitle(result.success ? '👥 Seuraava pelaaja' : 'ℹ️ Jono tyhjä')
                    .setDescription(result.message)
                    .setTimestamp();

                await replyWithEmbed(interaction, embed, true);
                const content = "Pelaamaan!!";
                await sendChannelAndUserMessage(interaction, result.player, content);
                break;
            }

            case 'status': {
                const statusEmbed = createStatusEmbed();
                await replyWithEmbed(interaction, statusEmbed, true);
                break;
            }

            case 'leave': {
                const tankKey = interaction.options.getString('tankki')!;
                const result = dataManager.leaveQueue(tankKey, user.id);

                const embed = new EmbedBuilder()
                    .setColor(result.success ? 0x00ff00 : 0xff0000)
                    .setTitle(result.success ? '✅ Poistuttu jonosta' : '❌ Virhe')
                    .setDescription(result.message)
                    .setFooter({ text: 'Lihabotti v1.0', iconURL: client.user?.displayAvatarURL() ?? undefined })
                    .setTimestamp();

                await replyWithEmbed(interaction, embed, true);
                break;
            }

            case 'clear': {
                const tankKey = interaction.options.getString('tankki')!;

                if (!dataManager.isTankOwner(user.id, tankKey)) {
                    const embed = new EmbedBuilder()
                        .setColor(0xff0000)
                        .setTitle('❌ Ei oikeuksia')
                        .setDescription('Voit tyhjentää vain oman tankkisi jonon!')
                        .setTimestamp();

                    await replyWithEmbed(interaction, embed, true);
                    break;
                }

                const result = dataManager.clearQueue(tankKey);

                const embed = new EmbedBuilder()
                    .setColor(0x00ff00)
                    .setTitle('🗑️ Jono tyhjennetty')
                    .setDescription(result.message)
                    .setTimestamp();

                await replyWithEmbed(interaction, embed);
                break;
            }
        }
    } catch (error) {
        console.error('Error handling command:', error);
        await interaction.reply({
            content: 'Tapahtui virhe komennon suorittamisessa!',
            ephemeral: true
        });
    }
});

function replyWithEmbed(
    interaction: ChatInputCommandInteraction,
    embed: EmbedBuilder,
    ephemeral = false
) {
    return interaction.reply({
        embeds: [embed],
        ephemeral
    });
}

function createStatusEmbed(): EmbedBuilder {
    const status = dataManager.getStatus();

    const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle('Kaken Varaus kalenteri')
        .setFooter({ text: 'Lihabotti v1.0', iconURL: client.user?.displayAvatarURL() ?? undefined })
        .setTimestamp();

    const tankKeys = Object.keys(status);
    if (tankKeys.length === 0) {
        embed.setDescription('Ei tankkeja saatavilla! Lisää itsesi tankiksi komennolla `/add-tank`');
        return embed;
    }

    tankKeys.forEach(key => {
        const { tank, queue } = status[key];
        const queueList = queue.players.length > 0
            ? queue.players.map((p, i) => `${i + 1}. ${p.name}`).join('\n')
            : ' - ';

        embed.addFields({
            name: `${tank.displayName} ( ${queue.players.length} )`,
            value: `\`\`\`\n${queueList}\n\`\`\``,
            inline: true
        });
    });

    return embed;
}

// Start the bot
const token = process.env.DISCORD_TOKEN;
if (!token) {
    console.error('DISCORD_TOKEN not found in environment variables!');
    process.exit(1);
}

client.login(token);
