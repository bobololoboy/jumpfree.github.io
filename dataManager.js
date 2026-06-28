import { WebsimSocket } from '@websim/websim-socket';
import * as UserOps from './data_user.js';
import * as ScoreOps from './data_score.js';
import * as AdminOps from './data_admin.js';
import * as ShopOps from './data_shop.js';

const room = new WebsimSocket();

export class DataManager {
    constructor() {
        this.room = room;
        this.userData = {
            id: null,
            coins: 0,
            owned_palettes: ['default'],
            equipped_palette: 'default',
            owned_songs: ['default_song'],
            equipped_song: 'default_song',
            equipped_death_effect: 'normal',
        };
        this.userRank = null;
        this.saveTimeout = null;
        this.listeners = new Set();

        // Track current username in memory (do not store in DB)
        this.currentUsername = null;

        // Top-of-board cache
        this.topUsername = null;
    }

    subscribe(callback) {
        this.listeners.add(callback);
        // Call immediately with current data
        callback(this.userData);
        return () => this.listeners.delete(callback);
    }

    notifyChange() {
        for (const listener of this.listeners) {
            listener(this.userData);
        }
    }

    async initialize() {
        // Ensure room is fully connected before setting up listeners or broadcasting
        try {
            await this.room.initialize();
        } catch (e) {
            console.error("Failed to initialize multiplayer room:", e);
        }

        await this.loadUserData();
        this.setupAdminListeners();
        
        // Broadcast initial presence (coins) to all peers
        if (this.userData) {
            this.room.updatePresence({ coins: this.userData.coins });
        }

        this.updateUserRank();
        this.updateTopInfo();
    }

    // --- User Data Delegates ---
    async loadUserData() { return UserOps.loadUserData(this); }
    async saveUserData(immediate = false) { return UserOps.saveUserData(this, immediate); }
    async deleteUserData() { return UserOps.deleteUserData(this); }
    exportUserData() { return UserOps.exportUserData(this); }
    async importUserData(json) { return UserOps.importUserData(this, json); }
    
    // Alias for old calls
    debouncedSaveUserData() { this.saveUserData(false); }

    // --- Score Delegates ---
    async submitScore(distance, timeMs) { return ScoreOps.submitScore(this, distance, timeMs); }
    async getUserRank() { return ScoreOps.getUserRank(this); }
    async updateUserRank() { return ScoreOps.updateUserRank(this); }
    async updateTopInfo() { return ScoreOps.updateTopInfo(this); }
    getEffectiveRankForBonuses() { return ScoreOps.getEffectiveRankForBonuses(this); }
    getDisplayRankForCurrentUser() { return ScoreOps.getDisplayRankForCurrentUser(this); }
    getCoinMultiplierForCurrentUser() { return ScoreOps.getCoinMultiplierForCurrentUser(this); }
    isSpecialUser() { return ScoreOps.isSpecialUser(this); }
    isSpecialTop() { return ScoreOps.isSpecialTop(this); }

    // --- Admin Delegates ---
    setupAdminListeners() { return AdminOps.setupAdminListeners(this); }
    showAdminGiftNotification(amount) { return AdminOps.showAdminGiftNotification(this, amount); }
    adminGiveCoins(targetClientId, amount) { return AdminOps.adminGiveCoins(this, targetClientId, amount); }

    // --- Shop Delegates ---
    addCoins(amount, skipMultipliers = false) { return ShopOps.addCoins(this, amount, skipMultipliers); }
    buyPalette(key) { return ShopOps.buyPalette(this, key); }
    equipPalette(key) { return ShopOps.equipPalette(this, key); }
    buySong(key) { return ShopOps.buySong(this, key); }
    equipSong(key) { return ShopOps.equipSong(this, key); }
    equipDeathEffect(key) { return ShopOps.equipDeathEffect(this, key); }
}