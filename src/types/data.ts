// src/types/data.ts

/**
 * Pelaajan tiedot jonossa
 */
export interface Player {
    /** Pelaajan Discord ID */
    id: string;
    /** Pelaajan näyttönimi */
    name: string;
    /** Jonoon liittymisen aika */
    joinTime: Date;
}

/**
 * Jonon tiedot
 */
export interface Queue {
    /** Jonossa olevat pelaajat järjestyksessä */
    players: Player[];
}

/**
 * Tankin tiedot
 */
export interface Tank {
    /** Tankin omistajan Discord ID */
    id: string;
    /** Tankin sisäinen nimi (lowercase) */
    name: string;
    /** Tankin näyttönimi */
    displayName: string;
    /** Tankin lisäämispäivä */
    addedAt: Date;
}

/**
 * Botin koko datan rakenne - yksi yhteinen jono kaikille tankeille
 */
export interface BotData {
    /** Kaikki tankit avain-arvo pareina */
    tanks: Record<string, Tank>;
    /** Yksi yhteinen jono kaikille tankeille */
    queue: Queue;
}