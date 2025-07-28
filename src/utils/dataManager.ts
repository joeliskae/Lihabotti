// src/utils/dataManager.ts
import * as fs from 'fs';
import * as path from 'path';

interface Player {
    id: string;
    name: string;
    joinTime: Date;
}

interface Queue {
    players: Player[];
}

interface Tank {
    id: string;
    name: string;
    displayName: string;
    addedAt: Date;
}

interface BotData {
    tanks: Record<string, Tank>;
    queues: Record<string, Queue>;
}

export class DataManager {
    private dataFile: string;
    private data: BotData;

    constructor() {
        this.dataFile = path.join(process.cwd(), 'bot-data.json');
        this.data = this.loadData();
    }

    private loadData(): BotData {
        try {
            if (fs.existsSync(this.dataFile)) {
                const fileData = fs.readFileSync(this.dataFile, 'utf8');
                const parsedData = JSON.parse(fileData);
                
                // Convert date strings back to Date objects
                Object.values(parsedData.tanks).forEach((tank: any) => {
                    tank.addedAt = new Date(tank.addedAt);
                });
                
                Object.values(parsedData.queues).forEach((queue: any) => {
                    queue.players.forEach((player: any) => {
                        player.joinTime = new Date(player.joinTime);
                    });
                });
                
                console.log(`Loaded data with ${Object.keys(parsedData.tanks).length} tanks`);
                return parsedData;
            }
        } catch (error) {
            console.error('Error loading data file:', error);
        }

        // Return default empty data
        console.log('Creating new data file');
        return {
            tanks: {},
            queues: {}
        };
    }

    private saveData(): void {
        try {
            fs.writeFileSync(this.dataFile, JSON.stringify(this.data, null, 2));
            console.log('Data saved successfully');
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }

    // Tank management
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

        this.data.queues[tankKey] = {
            players: []
        };

        this.saveData();
        return {
            success: true,
            message: `Tankki "${displayName}" lisätty onnistuneesti! Pelaajat voivat nyt liittyä jonoon.`
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

        const queueLength = this.data.queues[tankKey]?.players.length || 0;
        
        delete this.data.tanks[tankKey];
        delete this.data.queues[tankKey];

        this.saveData();
        return {
            success: true,
            message: `Tankki "${tank.displayName}" poistettu! ${queueLength > 0 ? `${queueLength} pelaajaa poistettiin jonosta.` : ''}`
        };
    }

    getTanks(): Tank[] {
        return Object.values(this.data.tanks);
    }

    getTankByKey(tankKey: string): Tank | undefined {
        return this.data.tanks[tankKey.toLowerCase()];
    }

    isTankOwner(userId: string, tankKey: string): boolean {
        const tank = this.data.tanks[tankKey.toLowerCase()];
        return tank ? tank.id === userId : false;
    }

    // Queue management (similar to before but with dynamic tanks)
    joinQueue(tankKey: string, playerId: string, playerName: string): { success: boolean; message: string; player?: Player } {
        tankKey = tankKey.toLowerCase();
        const tank = this.data.tanks[tankKey];
        
        if (!tank) {
            return {
                success: false,
                message: `Tankkia "${tankKey}" ei löydy! Katso saatavilla olevat tankit komennolla /tanks`
            };
        }

        const queue = this.data.queues[tankKey];

        // Check if player is already in this queue
        const existingPlayer = queue.players.find(p => p.id === playerId);
        if (existingPlayer) {
            return {
                success: false,
                message: `Olet jo ${tank.displayName}n jonossa! (Paikka ${queue.players.indexOf(existingPlayer) + 1})`
            };
        }

        // Check if player is in any other queue
        for (const [otherTankKey, otherQueue] of Object.entries(this.data.queues)) {
            if (otherTankKey !== tankKey) {
                const playerInOtherQueue = otherQueue.players.find(p => p.id === playerId);
                if (playerInOtherQueue) {
                    const otherTank = this.data.tanks[otherTankKey];
                    return {
                        success: false,
                        message: `Olet jo ${otherTank.displayName}n jonossa! Poistu ensin sieltä jos haluat vaihtaa.`
                    };
                }
            }
        }

        const player: Player = {
            id: playerId,
            name: playerName,
            joinTime: new Date()
        };

        queue.players.push(player);
        this.saveData();

        return {
            success: true,
            message: `${playerName} liittyi ${tank.displayName}n jonoon! Paikka jonossa: ${queue.players.length}`,
            player
        };
    }

    getNext(tankKey: string): { success: boolean; message: string; player?: Player } {
        tankKey = tankKey.toLowerCase();
        const tank = this.data.tanks[tankKey];
        const queue = this.data.queues[tankKey];
        
        if (!tank || !queue) {
            return {
                success: false,
                message: `Tankkia "${tankKey}" ei löydy!`
            };
        }

        if (queue.players.length === 0) {
            return {
                success: false,
                message: `${tank.displayName}n jono on tyhjä!`
            };
        }

        const nextPlayer = queue.players.shift()!;
        this.saveData();

        return {
            success: true,
            message: `Seuraava pelaaja: **${nextPlayer.name}**\nJonossa jäljellä: ${queue.players.length}`,
            player: nextPlayer
        };
    }

    leaveQueue(tankKey: string, playerId: string): { success: boolean; message: string} {
        tankKey = tankKey.toLowerCase();
        const tank = this.data.tanks[tankKey];
        const queue = this.data.queues[tankKey];
        
        if (!tank || !queue) {
            return {
                success: false,
                message: `Tankkia "${tankKey}" ei löydy!`
            };
        }

        const playerIndex = queue.players.findIndex(p => p.id === playerId);
        
        if (playerIndex === -1) {
            return {
                success: false,
                message: `Et ole ${tank.displayName}n jonossa!`
            };
        }

        const removedPlayer = queue.players.splice(playerIndex, 1)[0];
        this.saveData();

        return {
            success: true,
            message: `${removedPlayer.name} poistui ${tank.displayName}n jonosta!`
        };
    }

    clearQueue(tankKey: string): { success: boolean; message: string } {
        tankKey = tankKey.toLowerCase();
        const tank = this.data.tanks[tankKey];
        const queue = this.data.queues[tankKey];
        
        if (!tank || !queue) {
            return {
                success: false,
                message: `Tankkia "${tankKey}" ei löydy!`
            };
        }

        const clearedCount = queue.players.length;
        queue.players = [];
        this.saveData();

        return {
            success: true,
            message: `${tank.displayName}n jono tyhjennetty! Poistettiin ${clearedCount} pelaajaa.`
        };
    }

    getStatus(): Record<string, { tank: Tank; queue: Queue }> {
        const status: Record<string, { tank: Tank; queue: Queue }> = {};
        
        Object.entries(this.data.tanks).forEach(([key, tank]) => {
            status[key] = {
                tank,
                queue: { players: [...(this.data.queues[key]?.players ?? [])] }
            };
        });

        return status;
    }

    // Get all tank choices for slash commands
    getTankChoices(): Array<{ name: string; value: string }> {
        return Object.values(this.data.tanks).map(tank => ({
            name: tank.displayName,
            value: tank.name
        }));
    }
}