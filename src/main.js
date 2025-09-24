import { Game } from './game/game.js';

const canvas = document.getElementById('gameCanvas');
const statusElement = document.getElementById('status');

function showBootstrapError(message) {
  if (statusElement) {
    statusElement.textContent = message;
  }
  console.error(message);
}

if (!canvas) {
  showBootstrapError('Canvas introuvable dans la page. Vérifie que le fichier index.html est intact.');
} else if (!statusElement) {
  showBootstrapError("Impossible d'afficher l'état du jeu. L'élément #status est manquant.");
} else {
  try {
    statusElement.textContent = 'Chargement du niveau...';
    const game = new Game(canvas, statusElement);
    statusElement.textContent = 'Prêt ! Survole les obstacles en sautant.';
    // Exemple pour brancher une musique externe :
    // game.loadMusic('assets/musique.mp3');

    game.start();

    // Expose game for debugging in the console.
    window.neonDash = game;
  } catch (error) {
    showBootstrapError(
      "Le jeu n'a pas pu démarrer. Ouvre la page via un petit serveur local (ex: `npx serve`) et vérifie la console."
    );
    console.error(error);
  }
}
