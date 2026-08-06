# Bosquet Lent

Prototype de jeu de marche contemplative en 2D, construit en HTML, CSS et JavaScript avec Canvas.

Ouvrir `index.html` dans un navigateur pour jouer.

Le jeu est entierement solo et ne depend d'aucun serveur temps reel.

## App Store iOS

Le projet iOS est prepare avec Capacitor dans `ios/`.

Commandes utiles:

```bash
npm run build
npx cap sync ios
```

Sur un Mac avec Xcode:

```bash
npm install
npm run build
npx cap sync ios
npx cap open ios
```

Dans Xcode, ouvrir `ios/App/App.xcworkspace`, choisir l'equipe Apple Developer, verifier le Bundle Identifier `com.suphileericka.bosquetlent`, puis generer une archive avec `Product > Archive`. Envoyer ensuite l'archive vers App Store Connect depuis l'Organizer.

Avant soumission, remplacer les icones iOS par les icones finales de l'app dans Xcode et creer la fiche App Store Connect.

Nouveautes:
- Identifiant anonyme genere au premier lancement, sans creation de compte visible
- Pseudo joueur et reprise de partie
- Monde procedurale infini avec biomes qui reviennent sous de nouvelles formes
- Meteo changeante, villages, habitants, objets utiles et repos qui ralentit le temps
- Mini scene narrative a la fin de la premiere longue route

Controles:
- Fleches, ZQSD ou clic pour marcher
- E ou espace pour interagir
- Joystick discret sur mobile
- Bouton son en haut a droite pour couper ou remettre l'audio

Le jeu sauvegarde automatiquement la position, l'identite anonyme, le pseudo, les lanternes, les decouvertes, les missions, le carnet et les preferences audio dans le navigateur.
