/* ========================================
   Super Mario Bros. Web — Main Entry Point
   Initializes game and connects UI
   ======================================== */

import { GAME_STATE } from './config.js';
import { inputManager } from './input.js';
import { Game } from './game.js';

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    const splash = document.getElementById('splash');
    const hud = document.getElementById('hud');
    const pauseMenu = document.getElementById('pause-menu');
    const gameOver = document.getElementById('game-over');
    const victory = document.getElementById('victory');

    const livesEl = document.getElementById('lives');
    const coinsEl = document.getElementById('coins');
    const levelEl = document.getElementById('level');
    const timerEl = document.getElementById('timer');
    const finalMessage = document.getElementById('final-message');
    const victoryMessage = document.getElementById('victory-message');

    const game = new Game(canvas);
    inputManager.init();

    game.init();

    game.on('stateChange', (state) => {
        switch (state) {
            case GAME_STATE.MENU:
                splash.classList.remove('hidden');
                hud.classList.add('hidden');
                pauseMenu.classList.add('hidden');
                gameOver.classList.add('hidden');
                victory.classList.add('hidden');
                inputManager.setEnabled(false);
                break;
            case GAME_STATE.PLAYING:
                splash.classList.add('hidden');
                hud.classList.remove('hidden');
                pauseMenu.classList.add('hidden');
                gameOver.classList.add('hidden');
                victory.classList.add('hidden');
                inputManager.setEnabled(true);
                break;
            case GAME_STATE.PAUSED:
                pauseMenu.classList.remove('hidden');
                inputManager.setEnabled(false);
                break;
            case GAME_STATE.GAME_OVER:
                gameOver.classList.remove('hidden');
                finalMessage.textContent = `You collected ${game.totalCoins} coins!`;
                inputManager.setEnabled(false);
                break;
            case GAME_STATE.LEVEL_COMPLETE:
                victory.classList.remove('hidden');
                const totalLevels = 3;
                if (game.currentLevelIndex + 1 >= totalLevels) {
                    victoryMessage.textContent = `You beat all levels with ${game.totalCoins} coins!`;
                    document.getElementById('next-level-btn').textContent = 'Play Again';
                } else {
                    victoryMessage.textContent = `Coins: ${game.totalCoins} | Time: ${formatTimer(game.timer)}`;
                    document.getElementById('next-level-btn').textContent = 'Next Level';
                }
                inputManager.setEnabled(false);
                break;
        }
    });

    game.on('update', (data) => {
        livesEl.textContent = data.lives;
        coinsEl.textContent = data.coins;
        levelEl.textContent = data.level;
        timerEl.textContent = formatTimer(data.timer);
    });

    document.getElementById('start-btn').addEventListener('click', () => {
        game.start();
    });

    document.getElementById('resume-btn').addEventListener('click', () => {
        game.resume();
    });

    document.getElementById('menu-btn').addEventListener('click', () => {
        game.goToMenu();
    });

    document.getElementById('restart-btn').addEventListener('click', () => {
        game.restart();
    });

    document.getElementById('menu-btn-2').addEventListener('click', () => {
        game.goToMenu();
    });

    document.getElementById('next-level-btn').addEventListener('click', () => {
        game.nextLevel();
    });

    document.getElementById('menu-btn-3').addEventListener('click', () => {
        game.goToMenu();
    });
});

function formatTimer(frames) {
    const totalSeconds = Math.floor(frames / 60);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
