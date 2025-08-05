// src/utils/dataManager.ts
import * as fs from 'fs';
import * as path from 'path';
import { Player, Queue, Tank, BotData } from '../types/data';

export class DataManager {
    private dataFile: string;
    private data: BotData;

    /**
     * Luo uusi DataManager instanssi
     * Lataa olemassa olevan datan tai luo uuden tyhjän rakenteen
     */
    constructor() {
        this.dataFile = path.join(process.cwd(), 'bot-data.json');
        this.data = this.loadData();
    }

    /**
     * Lataa datan JSON tiedostosta
     * Muuntaa date stringit takaisin Date objekteiksi
     * @returns BotData objekti
     */
    private loadData(): BotData {
        try {
            if (fs.existsSync(this.dataFile)) {
                const fileData = fs.readFileSync(this.dataFile, 'utf8');
                const parsedData = JSON.parse(fileData);
                
                // Convert date strings back to Date objects
                Object.values(parsedData.tanks).forEach((tank: any) => {
                    tank.addedAt = new Date(tank.addedAt);
                });
                
                // Convert queue players date strings
                if (parsedData.queue && parsedData.queue.players) {
                    parsedData.queue.players.forEach((player: any) => {
                        player.joinTime = new Date(player.joinTime);
                    });
                }
                
                console.log(`Loaded data with ${Object.keys(parsedData.tanks).length} tanks and ${parsedData.queue?.players?.length || 0} players in queue`);
                return parsedData;
            }
        } catch (error) {
            console.error('Error loading data file:', error);
        }

        // Return default empty data
        console.log('Creating new data file');
        return {
            tanks: {},
            queue: { players: [] }
        };
    }

    /**
     * Tallentaa datan JSON tiedostoon
     */
    private saveData(): void {
        try {
            fs.writeFileSync(this.dataFile, JSON.stringify(this.data, null, 2));
            console.log('Data saved successfully');
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }

    /**
     * Lisää uuden tankin järjestelmään
     * @param userId Käyttäjän Discord ID
     * @param tankName Tankin sisäinen nimi (lowercasena)
     * @param displayName Tankin näyttönimi
     * @returns Tulos objekti onnistumisesta ja viestistä
     */
    addTank(userId: string, tankName: string, displayName: string): { success: boolean; message: string } {
        const tankKey = tankName.toLowerCase();
        
        if (this.data.tanks[tankKey]) {
            return {
                success: false,
                message: `Tankki "${displayName}" on jo olemassa!`
            };
        }

        // Check if user already has a tank
        const existingTank = Object.values(this.data.tanks).find(t => t.id === userId);
        if (existingTank) {
            return {
                success: false,
                message: `Sinulla on jo tankki "${existingTank.displayName}"! Poista se ensin jos haluat vaihtaa.`
            };
        }

        this.data.tanks[tankKey] = {
            id: userId,
            name: tankKey,
            displayName: displayName,
            addedAt: new Date()
        };

        this.saveData();
        return {
            success: true,
            message: `Tankki "${displayName}" lisätty onnistuneesti! Voit nyt ottaa pelaajia jonosta /next komennolla.`
        };
    }

    removeTank(userId: string, tankName: string): { success: boolean; message: string } {
        const tankKey = tankName.toLowerCase();
        const tank = this.data.tanks[tankKey];

        if (!tank) {
            return {
                success: false,
                message: `Tankkia "${tankName}" ei löydy!`
            };
        }

        if (tank.id !== userId) {
            return {
                success: false,
                message: `Voit poistaa vain oman tankkisi!`
            };
        }

        delete this.data.tanks[tankKey];
        this.saveData();
        
        return {
            success: true,
            message: `Tankki "${tank.displayName}" poistettu!`
        };
    }

    getTanks(): Tank[] {
        return Object.values(this.data.tanks);
    }

    getTankByKey(tankKey: string): Tank | undefined {
        return this.data.tanks[tankKey.toLowerCase()];
    }

    /**
     * Hakee käyttäjän oman tankin
     * @param userId Käyttäjän Discord ID
     * @returns Tank objekti tai undefined jos ei löydy
     */
    getUserTank(userId: string): Tank | undefined {
        return Object.values(this.data.tanks).find(tank => tank.id === userId);
    }

    /**
     * Tarkistaa onko käyttäjä rekisteröity tankki
     * @param userId Käyttäjän Discord ID
     * @returns true jos käyttäjä on tankki, muuten false
     */
    isTank(userId: string): boolean {
        return Object.values(this.data.tanks).some(tank => tank.id === userId);
    }

    isTankOwner(userId: string, tankKey: string): boolean {
        const tank = this.data.tanks[tankKey.toLowerCase()];
        return tank ? tank.id === userId : false;
    }

    /**
     * Liittää pelaajan yhteiseen jonoon
     */
    joinQueue(playerId: string, playerName: string): { success: boolean; message: string; player?: Player; position?: number } {
        // Varmistetaan että queue on olemassa
        if (!this.data.queue) {
            this.data.queue = { players: [] };
        }

        // Check if player is already in queue
        const existingPlayer = this.data.queue.players.find(p => p.id === playerId);
        if (existingPlayer) {
            const position = this.data.queue.players.indexOf(existingPlayer) + 1;
            return {
                success: false,
                message: `Olet jo jonossa! Sijasi: ${position}`
            };
        }

        const player: Player = {
            id: playerId,
            name: playerName,
            joinTime: new Date()
        };

        this.data.queue.players.push(player);
        this.saveData();

        const position = this.data.queue.players.length;
        return {
            success: true,
            message: `${playerName} liittyi jonoon! Paikka jonossa: ${position}`,
            player,
            position
        };
    }

    /**
     * Ottaa seuraavan pelaajan jonosta
     * Vain tankit voivat käyttää tätä
     */
    getNext(userId: string): { success: boolean; message: string; player?: Player } {
        // Tarkista onko käyttäjä tankki
        if (!this.isTank(userId)) {
            return {
                success: false,
                message: `Vain tankit voivat käyttää tätä komentoa! Rekisteröidy tankiksi komennolla /add-tank`
            };
        }

        // Varmistetaan että queue on olemassa
        if (!this.data.queue) {
            this.data.queue = { players: [] };
        }

        if (this.data.queue.players.length === 0) {
            return {
                success: false,
                message: `Jono on tyhjä!`
            };
        }

        const nextPlayer = this.data.queue.players.shift()!;
        this.saveData();

        return {
            success: true,
            message: `Seuraava pelaaja: **${nextPlayer.name}**\nJonossa jäljellä: ${this.data.queue.players.length}`,
            player: nextPlayer
        };
    }

    /**
     * Poistaa pelaajan jonosta
     */
    leaveQueue(playerId: string): { success: boolean; message: string} {
        // Varmistetaan että queue on olemassa
        if (!this.data.queue) {
            this.data.queue = { players: [] };
        }

        const playerIndex = this.data.queue.players.findIndex(p => p.id === playerId);
        
        if (playerIndex === -1) {
            return {
                success: false,
                message: `Et ole jonossa!`
            };
        }

        const removedPlayer = this.data.queue.players.splice(playerIndex, 1)[0];
        this.saveData();

        return {
            success: true,
            message: `${removedPlayer.name} poistui jonosta!`
        };
    }

    /**
     * Tyhjentää jonon (vain tankit voivat käyttää)
     */
    clearQueue(userId: string): { success: boolean; message: string } {
        // Tarkista onko käyttäjä tankki
        if (!this.isTank(userId)) {
            return {
                success: false,
                message: `Vain tankit voivat tyhjentää jonon!`
            };
        }

        // Varmistetaan että queue on olemassa
        if (!this.data.queue) {
            this.data.queue = { players: [] };
        }

        const clearedCount = this.data.queue.players.length;
        this.data.queue.players = [];
        this.saveData();

        return {
            success: true,
            message: `Jono tyhjennetty! Poistettiin ${clearedCount} pelaajaa.`
        };
    }

    /**
     * Palauttaa status tiedot
     */
    getStatus(): { tanks: Tank[]; queue: Queue; totalPlayers: number } {
        // Varmistetaan että queue on olemassa
        if (!this.data.queue) {
            this.data.queue = { players: [] };
        }
        
        return {
            tanks: Object.values(this.data.tanks),
            queue: { players: [...this.data.queue.players] },
            totalPlayers: this.data.queue.players.length
        };
    }

    /**
     * Palauttaa jonon pituuden
     */
    getQueueLength(): number {
        if (!this.data.queue) {
            this.data.queue = { players: [] };
        }
        return this.data.queue.players.length;
    }

    /**
     * Palauttaa pelaajan sijainnin jonossa
     */
    getPlayerPosition(playerId: string): number | null {
        if (!this.data.queue) {
            this.data.queue = { players: [] };
        }
        const index = this.data.queue.players.findIndex(p => p.id === playerId);
        return index === -1 ? null : index + 1;
    }

    // Get all tank choices for slash commands - ei enää tarvita koska ei valita tankkia
    getTankChoices(): Array<{ name: string; value: string }> {
        return Object.values(this.data.tanks).map(tank => ({
            name: tank.displayName,
            value: tank.name
        }));
    }
}