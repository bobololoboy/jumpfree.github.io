export const POPUPS_HTML = `
    <!-- Backdrop must sit BELOW modals to allow clicking/scrolling them -->
    <div id="modalBackdrop" style="position: fixed; inset: 0; background: rgba(0,0,0,0.2); opacity: 0; pointer-events: none; transition: opacity 300ms ease; z-index: 350;"></div>

    <div id="settingsMenu">
        <h2>Settings</h2>

        <fieldset class="settings-group">
            <legend>Audio</legend>
            <div class="setting">
                <label for="volume">SFX Volume:</label>
                <input type="range" id="volume" name="volume" min="0" max="1" step="0.01" value="1">
            </div>
            <div class="setting">
                <label for="musicVolume">Music Volume:</label>
                <input type="range" id="musicVolume" name="musicVolume" min="0" max="1" step="0.01" value="1">
            </div>
        </fieldset>

        <fieldset class="settings-group">
            <legend>Gameplay & Visuals</legend>
            <div class="settings-grid">
                <div class="setting">
                    <label for="showTimerToggle">Show Timer:</label>
                    <label class="switch">
                        <input type="checkbox" id="showTimerToggle" checked>
                        <span class="slider"></span>
                    </label>
                </div>
                <div class="setting">
                    <label for="performanceToggle">Performance Mode:</label>
                    <label class="switch">
                        <input type="checkbox" id="performanceToggle">
                        <span class="slider"></span>
                    </label>
                </div>
                <div class="setting">
                    <label for="skipAnimationsToggle">Skip Animations:</label>
                    <label class="switch">
                        <input type="checkbox" id="skipAnimationsToggle">
                        <span class="slider"></span>
                    </label>
                </div>
                <div class="setting">
                    <label for="deathOptionsButton">Death Animation:</label>
                    <button id="deathOptionsButton" class="px-4 py-1 text-sm">Customize</button>
                </div>
            </div>
        </fieldset>
        
        <fieldset class="settings-group">
             <legend>Player Data</legend>
            <div class="data-buttons">
                <button id="saveDataButton">Save Progress</button>
                <button id="downloadDataButton">Download Save</button>
                <button id="loadDataButton">Load Save</button>
            </div>
             <input type="file" id="loadDataInput" accept="application/json" style="display:none" />
             <button id="deleteDataButton" class="w-full mt-3" style="--button-bg: #fee2e2; --button-border: #ef4444; --button-text: #ef4444;">Delete All Progress</button>
        </fieldset>

        <div class="settings-actions">
            <button id="howToButton" title="Show how to play">How to Play</button>
            <button id="closeSettingsButton">Close</button>
        </div>
    </div>

    <div id="deathOptionsPopup">
        <h2 class="text-2xl font-bold mb-4">Death Animations</h2>
        <div id="deathOptionsContainer" class="space-y-3" style="max-height: 400px; overflow-y: auto; padding-right: 10px;">
            <!-- Death options will be rendered here -->
        </div>
        <button id="closeDeathOptionsButton" class="mt-6">Back to Settings</button>
    </div>

    <div id="shopPopup">
        <h2 class="text-3xl font-bold mb-4">Shop</h2>
        <p class="mb-4">Coins: <span id="shopCoinCount">0</span></p>
        <div id="shopItemsContainer" class="space-y-3" style="max-height: 400px; overflow-y: auto; padding-right: 10px; scrollbar-width: thin; scrollbar-color: var(--foreground-color) var(--background-color);">
            <!-- Shop sections will be rendered here by JS -->
        </div>
        <button id="closeShopButton" class="mt-6">Close</button>
    </div>

    <div id="leaderboardPopup">
        <!-- React will render here -->
    </div>
    
    <div id="adminPanel">
        <h2>Admin Control Panel</h2>
        <div class="admin-section">
            <h3>Spawn Enemies & Items</h3>
            <div class="admin-grid">
                <button class="admin-button" id="adminSpawnGoomba">Spawn Goomba</button>
                <button class="admin-button" id="adminSpawnFlyer">Spawn Flyer</button>
                <button class="admin-button" id="adminSpawnAbility">Spawn Powerup</button>
            </div>
        </div>
        <div class="admin-section">
            <h3>Player Management</h3>
            <div style="margin-bottom: 15px; display: flex; align-items: center; justify-content: center; gap: 10px; background: #ffe6e6; padding: 10px; border-radius: 4px;">
                <label for="adminCoinInput" style="font-size: 14px; color: red; font-weight: bold;">GIFT AMOUNT:</label>
                <input type="number" id="adminCoinInput" value="1000" step="100" style="width: 120px; padding: 6px; border: 2px solid red; font-family: inherit; text-align: center; font-weight: bold; font-size: 16px;">
            </div>
            <div id="adminPlayerList" class="player-list">
                <!-- Populated by JS -->
            </div>
        </div>
        <button id="closeAdminButton" class="admin-button" style="width: 100%; margin-top: 10px;">Close Panel</button>
    </div>

    <div id="howToPopup">
        <h2>How to Play</h2>
        <!-- scrollable body -->
        <div class="howto-body">
            <div class="howto-section">
                <p><strong>Goal:</strong> Run as far as you can. Avoid spikes and falling. Collect powerups to survive and go farther. Top player gets 5x coins!</p>
                <ul style="list-style: disc; padding-left: 18px; margin-top: 8px;">
                    <li>Move: A/D or Arrow keys. On mobile, use on-screen buttons.</li>
                    <li>Jump: W / Arrow Up / Space. Double jump when you have a charge.</li>
                    <li>Coins: Earned by distance milestones and picking up powerups. Spend them in the Shop.</li>
                </ul>
            </div>
            <div class="howto-section">
                <h3 class="text-xl font-bold mb-2">Powerups</h3>

                <!-- Double Jump -->
                <div class="howto-powerup">
                    <div class="howto-icon" aria-label="Double Jump icon">
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                            <rect x="1" y="1" width="30" height="30" rx="3" fill="transparent"></rect>
                            <text x="16" y="20" font-family="Space Mono, monospace" font-size="12" text-anchor="middle" fill="currentColor">2J</text>
                        </svg>
                    </div>
                    <div>
                        <div><strong>Double Jump</strong></div>
                        <div style="opacity:0.8">Grants one extra jump while airborne.</div>
                    </div>
                </div>

                <!-- Slow Fall -->
                <div class="howto-powerup">
                    <div class="howto-icon" aria-label="Slow Fall icon">
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                            <path d="M8 10 C12 6, 20 6, 24 10 C20 12, 12 12, 8 10 Z" stroke="currentColor" stroke-width="2" fill="none"/>
                            <path d="M10 20 Q16 24, 22 20" stroke="currentColor" stroke-width="2" fill="none" />
                        </svg>
                    </div>
                    <div>
                        <div><strong>Slow Fall</strong></div>
                        <div style="opacity:0.8">Reduces gravity for a short time. Safer landings.</div>
                    </div>
                </div>

                <!-- Speed (Time Dilation) -->
                <div class="howto-powerup">
                    <div class="howto-icon" aria-label="Speed icon">
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                            <rect x="1" y="1" width="30" height="30" rx="3" fill="transparent"></rect>
                            <text x="16" y="20" font-family="Space Mono, monospace" font-size="10" text-anchor="middle" fill="currentColor">SPD</text>
                        </svg>
                    </div>
                    <div>
                        <div><strong>Speed</strong> (super rare)</div>
                        <div style="opacity:0.8">Slows the world for 12s while you move at full speed. You can't lose a life during this effect; if you fall, you instantly respawn safely.</div>
                    </div>
                </div>

                <!-- Fly -->
                <div class="howto-powerup">
                    <div class="howto-icon" aria-label="Fly icon">
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                            <path d="M6 20 L16 12 L26 20" stroke="currentColor" stroke-width="2" fill="none"/>
                            <path d="M16 12 L16 6" stroke="currentColor" stroke-width="2"/>
                            <path d="M14 8 L16 6 L18 8" stroke="currentColor" stroke-width="2" fill="none"/>
                        </svg>
                    </div>
                    <div>
                        <div><strong>Fly</strong></div>
                        <div style="opacity:0.8">Hold jump to fly briefly. Great for crossing gaps.</div>
                    </div>
                </div>
                
                <!-- Invincibility -->
                <div class="howto-powerup">
                    <div class="howto-icon" aria-label="Invincibility icon">
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                            <rect x="1" y="1" width="30" height="30" rx="3" fill="transparent"></rect>
                            <text x="16" y="20" font-family="Space Mono, monospace" font-size="10" text-anchor="middle" fill="currentColor">INV</text>
                        </svg>
                    </div>
                    <div>
                        <div><strong>Invincibility</strong> (super rare)</div>
                        <div style="opacity:0.8">Become immune to all hazards for 5s.</div>
                    </div>
                </div>

                <!-- Life -->
                <div class="howto-powerup">
                    <div class="howto-icon" aria-label="Life icon" style="border:none;">
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round">
                           <path d="M16 28C10 24 4 19 4 13C4 8 8 4 13 4C15.5 4 18 6 16 9C14 6 16.5 4 19 4C24 4 28 8 28 13C28 19 22 24 16 28Z" />
                        </svg>
                    </div>
                    <div>
                        <div><strong>Life</strong> (super rare)</div>
                        <div style="opacity:0.8">Spawns only when under 2 lives. Restores +1 life. Never spawns in pairs.</div>
                    </div>
                </div>

                <!-- Shrink -->
                <div class="howto-powerup">
                    <div class="howto-icon" aria-label="Shrink icon">
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                            <rect x="3" y="3" width="26" height="26" stroke="currentColor" stroke-width="2" fill="none"/>
                            <rect x="11" y="11" width="10" height="10" fill="currentColor"/>
                        </svg>
                    </div>
                    <div>
                        <div><strong>Shrink</strong> (super rare)</div>
                        <div style="opacity:0.8">Become smaller (and harder to hit) for 5s.</div>
                    </div>
                </div>
            </div>

            <div class="howto-section">
                <h3 class="text-xl font-bold mb-2">World Elements</h3>

                <!-- Jump Pad -->
                <div class="howto-powerup">
                    <div class="howto-icon" aria-label="Jump Pad icon">
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                            <rect x="3" y="20" width="26" height="8" stroke="currentColor" stroke-width="2" fill="currentColor"></rect>
                            <path d="M16 6 L16 20 M12 10 L16 6 L20 10" stroke="currentColor" stroke-width="2.5" fill="none"/>
                        </svg>
                    </div>
                    <div>
                        <div><strong>Jump Pad</strong></div>
                        <div style="opacity:0.8">Launches you high into the air.</div>
                    </div>
                </div>
                <!-- Hazards -->
                <div class="howto-powerup">
                    <div class="howto-icon" aria-label="Spike icon">
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                            <path d="M6 26 L16 6 L26 26 Z" stroke="currentColor" stroke-width="2" fill="currentColor"/>
                        </svg>
                    </div>
                    <div>
                        <div><strong>Hazards</strong></div>
                        <div style="opacity:0.8">Spikes, Spinners, and falling will cost you a life. Avoid them!</div>
                    </div>
                </div>

                <!-- Enemies -->
                <div class="howto-powerup">
                    <div class="howto-icon" aria-label="Enemy icon">
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M26 24 a1,1 0 0,0 -20,0" fill="currentColor"/>
                            <circle cx="12" cy="14" r="2" fill="currentColor" />
                            <circle cx="20" cy="14" r="2" fill="currentColor" />
                            <path d="M10 20 Q16 22 22 20" stroke-width="1.5" fill="none"/>
                        </svg>
                    </div>
                    <div>
                        <div><strong>Enemies</strong></div>
                        <div style="opacity:0.8">Jump on enemies to defeat them and earn extra coins. Don't touch their sides!</div>
                    </div>
                </div>
            </div>
        </div>
        <div class="howto-actions">
            <button id="closeHowToButton">Close</button>
        </div>
    </div>
`;