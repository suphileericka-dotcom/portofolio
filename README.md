# Bosquet Lent

Prototype de jeu de marche contemplative en 2D, construit en HTML, CSS et JavaScript avec Canvas.

Ouvrir `index.html` dans un navigateur pour jouer.

Pour jouer avec le serveur temps reel:
- Installer les dependances: `npm install`
- Lancer le serveur: `npm start`
- Ouvrir `http://localhost:3000`
- Sur telephone, ouvrir l'adresse reseau du PC, par exemple `http://192.168.1.25:3000`

Nouveautes:
- Identifiant anonyme genere au premier lancement, sans creation de compte visible
- Pseudo joueur, code de partie ami et reprise de partie
- Creation ou rejoindre une partie depuis les options, avec parties de 2 a 4 joueurs
- Croix pour quitter une partie ami et continuer en solo
- Serveur Node.js + Socket.IO pour creer les parties, synchroniser les joueurs, reactions, repos et dons aux habitants
- Monde procedurale infini avec biomes qui reviennent sous de nouvelles formes
- Meteo changeante, villages, habitants, objets utiles et repos qui ralentit le temps
- Mini scene narrative a la fin de la premiere longue route

Controles:
- Fleches, ZQSD ou clic pour marcher
- E ou espace pour interagir
- Joystick discret sur mobile
- Bouton son en haut a droite pour couper ou remettre l'audio

Le jeu sauvegarde automatiquement la position, l'identite anonyme, le pseudo, le code de partie, les lanternes, les decouvertes et les preferences audio dans le navigateur. Le serveur sauvegarde aussi les parties dans `server-save.json`.
