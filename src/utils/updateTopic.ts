import { Client, TextChannel } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const CHANNEL_ID = process.env.QUEUE_CHANNEL_ID || 'HALOOOOOO';

if (!CHANNEL_ID) {
    throw new Error('QUEUE_CHANNEL_ID ei ole asetettu .env-tiedostossa.');
}

export async function updateChannelTopic(client: Client, queueLength: number) {
    try {
        const channel = await client.channels.fetch(CHANNEL_ID);

        if (!channel || !channel.isTextBased() || !(channel instanceof TextChannel)) return;

        const topic = `Jonossa ${queueLength} pelaaja${queueLength !== 1 ? 'a' : ''}`;
        if (queueLength === 0) {
            console.log("Seting - Dead game...");
            console.time('setTopic');
            await channel.setTopic(" Dead game...")
                .then(newChannel => console.log(`Channel's new topic is ${newChannel.topic}`))
                .catch(console.error);
            console.timeEnd('setTopic');
        }
        else {
            console.log("Calling setTopic...");
            console.time('setTopic');
            await channel.setTopic(topic)
                .then(newChannel => console.log(`Channel's new topic is ${newChannel.topic}`))
                .catch(console.error);
            console.timeEnd('setTopic');
        }
    } catch (error) {
        console.error('Kanavan topicin päivitys epäonnistui:', error);
    }
}
