import { PALETTES, SONGS } from './constants.js';

export async function loadUserData(dm) {
    try {
        const user = await window.websim.getCurrentUser();
        if (!user.id) return null;
        dm.userData.id = user.id;
        dm.currentUsername = user.username || null;

        const data = await dm.room.collection('user_data_v1').filter({ id: user.id }).getList();
        if (data && data.length > 0) {
            const dbData = data[0];
            dm.userData.coins = dbData.coins !== undefined ? dbData.coins : 0;
            dm.userData.owned_palettes = dbData.owned_palettes || ['default'];
            dm.userData.equipped_palette = dbData.equipped_palette || 'default';
            dm.userData.owned_songs = dbData.owned_songs || ['default_song'];
            dm.userData.equipped_song = dbData.equipped_song || 'default_song';
            dm.userData.equipped_death_effect = dbData.equipped_death_effect || 'normal';
        } else {
            // New user: ensure defaults are saved
            await dm.saveUserData(true);
        }
        dm.notifyChange();
        dm.room.updatePresence({ coins: dm.userData.coins });
        return dm.userData;
    } catch(e) {
        console.error("Could not load user data", e);
        return null;
    }
}

export async function saveUserData(dm, immediate = false) {
    if (dm.saveTimeout) {
        clearTimeout(dm.saveTimeout);
        dm.saveTimeout = null;
    }
    
    if (!dm.userData.id) return;

    const performSave = async () => {
        try {
            await dm.room.collection('user_data_v1').upsert({
                id: dm.userData.id,
                coins: dm.userData.coins,
                owned_palettes: dm.userData.owned_palettes,
                equipped_palette: dm.userData.equipped_palette,
                owned_songs: dm.userData.owned_songs,
                equipped_song: dm.userData.equipped_song,
                equipped_death_effect: dm.userData.equipped_death_effect
            });
            console.log("Data saved to database.");
        } catch(e) {
            console.error("Could not save user data", e);
        }
    };

    if (immediate) {
        await performSave();
    } else {
        dm.saveTimeout = setTimeout(performSave, 1500);
    }
}

export async function deleteUserData(dm) {
    if (!dm.userData.id) return;
    try {
        await dm.room.collection('user_data_v1').delete(dm.userData.id);
        // Reset local data to defaults
        dm.userData.coins = 0;
        dm.userData.owned_palettes = ['default'];
        dm.userData.equipped_palette = 'default';
        dm.userData.owned_songs = ['default_song'];
        dm.userData.equipped_song = 'default_song';
        dm.userData.equipped_death_effect = 'normal';
        console.log("User data deleted successfully.");
    } catch (e) {
        console.error("Could not delete user data", e);
    }
}

export function exportUserData(dm) {
    const payload = {
        version: 1,
        exported_at: new Date().toISOString(),
        // Do not export user ID to avoid accidental cross-account overwrite scenarios
        data: {
            coins: dm.userData.coins,
            owned_palettes: dm.userData.owned_palettes,
            equipped_palette: dm.userData.equipped_palette,
            owned_songs: dm.userData.owned_songs,
            equipped_song: dm.userData.equipped_song,
            equipped_death_effect: dm.userData.equipped_death_effect
        }
    };
    return payload;
}

export async function importUserData(dm, json) {
    try {
        if (!json || typeof json !== 'object') return false;
        const payload = json.data ? json.data : json; // support raw data object too
        const sanitizeArray = (arr) => Array.isArray(arr) ? Array.from(new Set(arr.filter(x => typeof x === 'string'))) : [];

        let coins = Number.isFinite(payload.coins) ? Math.max(0, Math.floor(payload.coins)) : 0;
        let owned_palettes = sanitizeArray(payload.owned_palettes);
        let owned_songs = sanitizeArray(payload.owned_songs);
        let equipped_palette = typeof payload.equipped_palette === 'string' ? payload.equipped_palette : 'default';
        let equipped_song = typeof payload.equipped_song === 'string' ? payload.equipped_song : 'default_song';
        let equipped_death_effect = typeof payload.equipped_death_effect === 'string' ? payload.equipped_death_effect : 'normal';

        // Ensure defaults exist
        if (!owned_palettes.includes('default')) owned_palettes.unshift('default');
        if (!owned_songs.includes('default_song')) owned_songs.unshift('default_song');

        // Filter out unknown palettes/songs
        owned_palettes = owned_palettes.filter(k => !!PALETTES[k]);
        if (!PALETTES[equipped_palette]) equipped_palette = 'default';
        if (!owned_palettes.includes(equipped_palette)) equipped_palette = 'default';

        owned_songs = owned_songs.filter(k => !!SONGS[k]);
        if (!SONGS[equipped_song]) equipped_song = 'default_song';
        if (!owned_songs.includes(equipped_song)) equipped_song = 'default_song';

        // Apply to current user
        const currentUser = await window.websim.getCurrentUser();
        if (!currentUser?.id) return false;
        dm.userData.id = currentUser.id;
        dm.userData.coins = coins;
        dm.userData.owned_palettes = owned_palettes;
        dm.userData.equipped_palette = equipped_palette;
        dm.userData.owned_songs = owned_songs;
        dm.userData.equipped_song = equipped_song;
        dm.userData.equipped_death_effect = equipped_death_effect;

        await dm.saveUserData(true);
        await dm.updateUserRank(); // keep rank-dependent UI consistent
        dm.notifyChange();
        dm.room.updatePresence({ coins: dm.userData.coins });
        return true;
    } catch (e) {
        console.error('Import failed:', e);
        return false;
    }
}