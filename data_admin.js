export function setupAdminListeners(dm) {
    // Listen for coin gifts from admin
    dm.room.subscribePresenceUpdateRequests((req, fromClientId) => {
        if (req.type === 'admin_gift_coins') {
            const sender = dm.room.peers[fromClientId];
            // Removed strict username check to ensure syncing works for testing/creators
            console.log(`Received ${req.amount} coins from ${sender ? sender.username : 'unknown'}`);
            
            // addCoins handles notification and saving
            dm.addCoins(req.amount, true); // True to skip multipliers for exact admin amount
            dm.showAdminGiftNotification(req.amount);
        }
    });
}

export function showAdminGiftNotification(dm, amount) {
    const notif = document.createElement('div');
    notif.style.cssText = `
        position: fixed; 
        top: 20%; 
        left: 50%; 
        transform: translate(-50%, -50%); 
        background: rgba(0,0,0,0.9); 
        color: #FFD700; 
        padding: 20px 40px; 
        border: 3px solid #FFD700; 
        z-index: 9999; 
        font-family: 'Space Mono', monospace; 
        font-size: 24px;
        font-weight: bold;
        pointer-events: none;
        box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
        text-align: center;
        animation: popInAndOut 4s forwards;
    `;
    notif.innerHTML = `ADMIN GIFT<br><span style="font-size: 36px">+${amount} Coins!</span>`;
    
    if (!document.getElementById('admin-notif-style')) {
        const style = document.createElement('style');
        style.id = 'admin-notif-style';
        style.textContent = `
            @keyframes popInAndOut {
                0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
                10% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
                15% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                80% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 4000);
}

export function adminGiveCoins(dm, targetClientId, amount) {
    // Special handling for giving coins to self
    if (targetClientId === dm.room.clientId) {
        dm.addCoins(amount, true); // Skip multipliers for admin actions
        dm.showAdminGiftNotification(amount);
        return;
    } 
    
    // Send request to target client to update their own data
    dm.room.requestPresenceUpdate(targetClientId, {
        type: 'admin_gift_coins',
        amount: amount
    });
}