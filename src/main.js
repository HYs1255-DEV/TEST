import { Game } from './game/game.js';

const container = document.getElementById('gameContainer');
const statusElement = document.getElementById('status');

function showBootstrapError(message) {
  if (statusElement) {
    statusElement.textContent = message;
  }
  console.error(message);
}

if (!container) {
  showBootstrapError("Conteneur introuvable dans la page. Vérifie que l'élément #gameContainer existe.");
} else if (!statusElement) {
  showBootstrapError("Impossible d'afficher l'état du jeu. L'élément #status est manquant.");
} else {
  try {
    statusElement.textContent = 'Initialisation du monde néon...';
    const game = new Game(container, statusElement);
    statusElement.textContent = 'Prêt ! Maintiens le rythme et saute pour survivre.';
    // game.loadMusic('assets/musique.mp3');

    game.start();
    window.neonDash3D = game;
  } catch (error) {
    showBootstrapError(
      "Le jeu 3D n'a pas pu démarrer. Ouvre la page via un petit serveur local (ex: `npx serve`) et vérifie la console."
    );
    console.error(error);
  }
}
