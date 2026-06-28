const SPECIAL_USER = 'Absolutely_Aaden123';

export function isSpecialUser(dm) {
    return dm.currentUsername === SPECIAL_USER;
}

export function isSpecialTop(dm) {
    return dm.topUsername === SPECIAL_USER;
}

export async function updateTopInfo(dm) {
    try {
        const rows = await dm.room.query(`
            WITH user_info AS (
                SELECT id, username FROM public.user
            )
            SELECT u.username
            FROM public.scores_v1 s
            JOIN user_info u ON s.id = u.id
            ORDER BY s.distance DESC, s.time_ms ASC
            LIMIT 1
        `);
        dm.topUsername = rows && rows[0] ? rows[0].username : null;
    } catch (e) {
        console.error('Failed to fetch top username:', e);
        dm.topUsername = null;
    }
}

export async function getUserRank(dm) {
    if (!dm.userData.id) return null;
    try {
        const result = await dm.room.query(`
            WITH ranked_scores AS (
                SELECT 
                    s.id as user_id, 
                    RANK() OVER (ORDER BY s.distance DESC, s.time_ms ASC) as rank
                FROM public.scores_v1 s
            )
            SELECT rank
            FROM ranked_scores
            WHERE user_id = $1
        `, [dm.userData.id]);

        if (result && result.length > 0) {
            return parseInt(result[0].rank, 10);
        }
        return null;
    } catch (e) {
        console.error("Failed to get user rank:", e);
        return null;
    }
}

export async function updateUserRank(dm) {
    dm.userRank = await dm.getUserRank();
}

export async function submitScore(dm, distance, timeMs) {
    if (distance <= 0) return;
    try {
        const currentUser = await window.websim.getCurrentUser();
        if (!currentUser.id) return;

        const existingScores = await dm.room.collection('scores_v1').filter({ id: currentUser.id }).getList();
        const existingScore = existingScores[0];
        
        const shouldUpdate = !existingScore ||
                         distance > existingScore.distance ||
                         (distance === existingScore.distance && timeMs < existingScore.time_ms);

        if (shouldUpdate) {
             await dm.room.collection('scores_v1').upsert({
                id: currentUser.id,
                distance: distance,
                time_ms: timeMs,
            });
        }
        // Refresh caches
        await Promise.all([
            dm.updateUserRank(),
            dm.updateTopInfo()
        ]);
    } catch (e) {
        console.error("Failed to submit score:", e);
    }
}

// Effective rank for coin bonuses:
// - Normally: 1 => 5x, 2 => 2x
// - If SPECIAL is top: actual #2 becomes effective #1 (5x), actual #3 becomes effective #2 (2x)
export function getEffectiveRankForBonuses(dm) {
    if (dm.userRank == null) return null;
    if (dm.isSpecialUser()) {
        // Special user's personal coin bonus is handled separately (10x), don't map here
        return null;
    }
    if (dm.isSpecialTop()) {
        if (dm.userRank === 2) return 1; // promoted to first
        if (dm.userRank === 3) return 2; // promoted to second
        return dm.userRank >= 4 ? dm.userRank - 1 : dm.userRank; // others shift visually, but no bonus beyond 2
    }
    return dm.userRank;
}

// For UI display on the user's own HUD:
// If special user AND they are top, show "0th".
// Otherwise show their actual rank (or null).
export function getDisplayRankForCurrentUser(dm) {
    if (dm.userRank == null) return null;
    if (dm.isSpecialUser() && dm.userRank === 1) return 0;
    if (dm.isSpecialTop()) {
        // Others below shift up visually (2->1, 3->2, etc.)
        if (!dm.isSpecialUser()) {
            return Math.max(1, dm.userRank - 1);
        }
    }
    return dm.userRank;
}

// Numeric multiplier currently applied to the user's coins
export function getCoinMultiplierForCurrentUser(dm) {
    if (dm.isSpecialUser()) return 10;
    const eff = dm.getEffectiveRankForBonuses();
    if (eff === 1) return 5;
    if (eff === 2) return 2;
    return 1;
}