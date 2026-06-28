import { PALETTES, SONGS } from './constants.js';

export function addCoins(dm, amount, skipMultipliers = false) {
    if (!amount || amount <= 0) return 0;
    let finalAmount = amount;

    if (!skipMultipliers) {
        if (dm.isSpecialUser()) {
            finalAmount *= 10;
        } else {
            const eff = dm.getEffectiveRankForBonuses();
            if (eff === 1) finalAmount *= 5;
            else if (eff === 2) finalAmount *= 2;
        }
    }

    dm.userData.coins += finalAmount;
    dm.room.updatePresence({ coins: dm.userData.coins });
    dm.notifyChange();
    dm.saveUserData(false); // Debounced save
    return dm.userData.coins;
}

export function buyPalette(dm, key) {
    const palette = PALETTES[key];
    if (dm.userData.coins >= palette.price && !dm.userData.owned_palettes.includes(key)) {
        dm.userData.coins -= palette.price;
        dm.userData.owned_palettes.push(key);
        dm.room.updatePresence({ coins: dm.userData.coins });
        dm.notifyChange();
        dm.saveUserData(true);
        return true;
    }
    return false;
}

export function equipPalette(dm, key) {
    if (dm.userData.owned_palettes.includes(key)) {
        dm.userData.equipped_palette = key;
        dm.notifyChange();
        dm.saveUserData(true);
        return true;
    }
    return false;
}

export function buySong(dm, key) {
    const song = SONGS[key];
    if (dm.userData.coins >= song.price && !dm.userData.owned_songs.includes(key)) {
        dm.userData.coins -= song.price;
        dm.userData.owned_songs.push(key);
        dm.room.updatePresence({ coins: dm.userData.coins });
        dm.notifyChange();
        dm.saveUserData(true);
        return true;
    }
    return false;
}

export function equipSong(dm, key) {
    if (dm.userData.owned_songs.includes(key)) {
        dm.userData.equipped_song = key;
        dm.notifyChange();
        dm.saveUserData(true);
        return true;
    }
    return false;
}

export function equipDeathEffect(dm, key) {
    dm.userData.equipped_death_effect = key;
    dm.notifyChange();
    dm.saveUserData(true);
    return true;
}