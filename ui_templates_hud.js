export const HUD_HTML = `
    <div id="ui">
        <div>Distance: <span id="distance">0</span>m</div>
        <div id="timerContainer">Time: <span id="timer">0.0</span>s</div>
        <div>Lives: <span id="lives">3</span></div>
        <div id="coinBoostIndicator" style="display: none; color: #FFD700; font-weight: bold; text-shadow: 1px 1px 2px black;">👑 5x Coins!</div>
        <div id="active-powers"></div>
    </div>

    <div id="mobileControls" class="hidden">
        <div id="moveControls">
            <button id="leftButton">◀</button>
            <button id="rightButton">▶</button>
        </div>
        <button id="jumpButton">▲</button>
    </div>
`;