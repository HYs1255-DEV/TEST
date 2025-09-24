import { Game } from './game/game.js';

const canvas = document.getElementById('gameCanvas');
const statusElement = document.getElementById('status');

const game = new Game(canvas, statusElement);
// Example to plug an external soundtrack:
// game.loadMusic('assets/musique.mp3');

game.start();

// Expose game for debugging in the console.
window.neonDash = game;
