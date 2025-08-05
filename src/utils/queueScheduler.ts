// src/utils/queueScheduler.ts
import { Client } from 'discord.js';
import { DataManager } from './dataManager';
import { updateChannelTopic } from './updateTopic';

/**
 * Automaattinen jonon tyhjennys kello 5 yöllä
 */
export class QueueScheduler {
    private client: Client;
    private dataManager: DataManager;
    private lastClearDate: string = '';
    private intervalId: NodeJS.Timeout | null = null;

    constructor(client: Client, dataManager: DataManager) {
        this.client = client;
        this.dataManager = dataManager;
    }

    /**
     * Käynnistä scheduler joka tarkistaa kellonajan minuutin välein
     */
    start() {
        console.log('Käynnistetään jonon automaattinen tyhjennys (klo 5:00)');
        
        // Tarkista joka minuutti
        this.intervalId = setInterval(() => {
            this.checkAndClearQueue();
        }, 60000); // 60 sekuntia = 1 minuutti
    }

    /**
     * Pysäytä scheduler
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('Jonon scheduler pysäytetty');
        }
    }

    /**
     * Tarkista onko kello 5:00 ja tyhjennä jono kerran päivässä
     */
    private async checkAndClearQueue() {
        try {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const today = now.getDate() + '-' + now.getMonth() + '-' + now.getFullYear();

            // Tarkista onko kello 5:00-5:01 välillä ja ei ole tyhjennetty tänään
            if (currentHour === 5 && currentMinute === 0 && this.lastClearDate !== today) {
                const queueLength = this.dataManager.getQueueLength();
                
                if (queueLength > 0) {
                    console.log(`Kello 5:00 - Tyhjennetään jono (${queueLength} pelaajaa)`);
                    
                    // Tyhjennä jono (käytä system ID:tä)
                    const result = this.dataManager.clearQueue('SYSTEM_AUTO_CLEAR');
                    
                    if (result.success) {
                        // Päivitä kanavan topic
                        await updateChannelTopic(this.client, 0);
                        console.log('Jono tyhjennetty automaattisesti klo 5:00');
                    }
                } else {
                    console.log('Kello 5:00 - Jono on jo tyhjä');
                }
                
                // Merkitse että tänään on jo tyhjennetty
                this.lastClearDate = today;
            }
        } catch (error) {
            console.error('Virhe automaattisessa jonon tyhjennuksessä:', error);
        }
    }
}