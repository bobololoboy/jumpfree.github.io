export const MENUS_HTML = `
    <div id="splashScreen" style="position: fixed; inset: 0; z-index: 999; display: none; align-items: center; justify-content: center; background-color: white; opacity: 0; transition: opacity 0.5s ease-in-out, background-color 0.5s ease-in-out;">
        <img id="splashLogo" src="/costume1 (1).svg" alt="logo" style="width: 150px; height: 150px; opacity: 0; transform: scale(0.8); transition: opacity 0.7s ease-in-out, transform 0.7s ease-in-out;"/>
    </div>

    <div id="mainMenu">
        <canvas id="menuCanvas"></canvas>
        <h1>JumpLine</h1>

        <button id="playButton" class="main-menu-button">PLAY</button>
        <br>
        <button id="leaderboardButton" class="main-menu-button">Leaderboard</button>
        <button id="settingsButton" class="menu-corner-button">
            <span class="icon settings-icon" aria-hidden="true"></span>
        </button>
        <button id="shopButton" class="menu-corner-button">
            <span class="icon shop-icon" aria-hidden="true"></span>
        </button>
    </div>

    <div id="pauseMenu">
        <h2>Paused</h2>
        <div class="pause-options">
            <button id="resumeButton" class="w-full">Resume</button>
            <button id="pauseSettingsButton" class="w-full mt-3">Settings</button>
            <button id="pauseShopButton" class="w-full mt-3">Shop</button>
            <button id="pauseQuitButton" class="w-full mt-3">Back to Main Menu</button>
        </div>
    </div>

    <div id="gameOverPopup">
        <img src="deadhead.svg" alt="Game Over">
        <h2>Game Over!</h2>
        <p>You traveled <span id="finalDistance">0</span>m in <span id="finalTime">0.0</span>s</p>
        <p id="leaderboardRankContainer" style="display: none; margin-top: 10px; font-size: 18px;">Your rank: <span id="leaderboardRank">#?</span></p>
        <button id="restartButton">Play Again</button>
        <button id="backToMenuButton" style="margin-top: 10px;">Back to Menu</button>
    </div>
`;