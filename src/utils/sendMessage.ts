import { ChatInputCommandInteraction } from 'discord.js';

export async function sendChannelAndUserMessage(
  interaction: ChatInputCommandInteraction,
  next: any,
  content: string
): Promise<void> {
  const channel = interaction.channel;

  if (!channel || !('send' in channel) || typeof channel.send !== 'function') {
    console.error('Kanavalle ei voi lähettää viestiä.');
    return;
  }

  // Muodosta viesti, jossa mainitaan käyttäjä
  try {
      const messageContent = `<@${next.id.toString()}> ${content}`;
      const sentMessage = await channel.send(messageContent);
        
      setTimeout(async () => {
        try {
          await sentMessage.delete();
        } catch {
          // Ei haittaa, jos viesti poistettu jo
        }
      }, 900000); // 15 minuuttia
    } catch {
        console.log("Pikku errori saatiin aikaan tääl m+ viestin lähettämises :)")
    }
}
