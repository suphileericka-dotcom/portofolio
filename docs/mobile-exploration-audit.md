# Audit et essai mobile — 18 octobre 2026

## Périmètre validable

À la demande du joueur, aucun nouveau décor ni petite forêt indépendante.
Le jeu principal utilise **le monde actuel**, ses personnages, ses habitants,
ses villages et les fonctions de dessin originales. Il n'existe pas de mode
séparé ni de deuxième sauvegarde.

Le joystick progressif, les aides visuelles et les scènes brèves sont réservés
à ce mode. La profondeur est expérimentée dans le premier tronçon existant
(x < 2400), puis se referme progressivement sur le chemin à partir de x=2140.
Les autres zones gardent leur déplacement actuel jusqu'à validation.
Il ne s'agit pas encore d'une conversion complète des villages en cartes libres.

## Constats sur le moteur

- Canvas 2D, rendu immédiat : `draw`, `drawWorldObjects`, `drawCharacter`.
- `update` intègre `player.x`, puis écrase `player.y` avec `getWalkSurfaceY`.
  Les touches verticales commandent actuellement le saut. Le joystick contient
  déjà un axe y, mais celui-ci ne contrôle pas le déplacement.
- `world.ground` dépend de la hauteur de l'écran ; ce n'est pas une coordonnée
  persistante. La caméra suit x, avec un zoom pour les pauses et les scènes.
- Carte procédurale le long de x, chapitres de 2400 unités. Villages, découvertes,
  quêtes et portails ont des identifiants et positions liés à cet axe.
- `getRiverCrossings` et `getWalkSurfaceY` partagent la géométrie réelle du pont.
  Changer cette fonction globalement déplacerait aussi habitants et objets.
- Les interactions recherchent surtout une distance horizontale. Les dessins
  sont organisés par catégories ; ils ne disposent pas d'un tri complet par y.
- Les arbres de parallaxe sont un arrière-plan décoratif. Les deux troncs du
  premier plan de `drawCoverForeground` ont, eux, une emprise identifiable.
- Sauvegardes, profil et options sont trois clés localStorage indépendantes.
  Les missions, cadeaux, capacités, Carnet, inventaire, animaux et portails
  continuent à passer par leurs fonctions existantes.
- Bubblewrap : package `com.suphileericka.bosquetlent`, minSdk 24, code 6,
  alias de signature `upload`. L'orientation était `any` alors que l'affichage
  était déjà `fullscreen` : ce sont deux réglages différents.

## Architecture retenue

2D latérale avec profondeur au sol, sans 3D ni remplacement graphique.
La position est `(x, depth)` ; le rendu calcule
`y = getWalkSurfaceY(x) + depth`. Le saut reste un décalage visuel distinct.
Le joystick produit un vecteur normalisé avec zone morte et accélération
analogique. Les diagonales ne donnent pas de bonus de vitesse ; la profondeur
est projetée à 62 % pour conserver la perspective des dessins actuels.

Le déplacement limite la bande de sol déjà dessinée à -58 à +46 unités,
avec collision elliptique aux pieds des troncs, déplacement par sous-pas et
glissement sur les obstacles. Le personnage passe derrière le plan des arbres
quand sa profondeur est inférieure à -18 ; le compagnon suit cette profondeur.
Le pont reste inchangé, hors de la zone d'essai de profondeur.

Pour étendre ultérieurement : données d'emprise au sol pour chaque maison,
mobilier et berge ; zones navigables et passages de pont ; tri stable par pied
pour personnages et éléments interactifs ; distances 2D et portées de missions.
Les arbres de parallaxe devront rester décoratifs. Cette migration est différée
jusqu'à validation du comportement et de la fidélité visuelle de l'essai.

## Sauvegarde et tutoriel

Copie fonctionnelle des sources avant l'essai :
`.tools/backups/before-forest-prototype-2026-10-18/` (inclut la pluie améliorée).
Le dossier contient aussi les anciennes configurations Bubblewrap, sans clé.

La partie utilise les clés de sauvegarde habituelles (`bosquet-lent-save`,
profil et options). La profondeur est sauvegardée avec la partie normale.
Les gestes appris sont mémorisés dans `bosquet-lent-learning-v1` et ne reviennent
pas à chaque lancement.

Nouvelle partie : révélation courte, bouton Passer et enveloppe existante mise
en valeur. Une seule petite scène de découverte accompagne la première avancée
dans ce tronçon. La préférence de réduction des animations est respectée.

## Android

`orientation: landscape` est configuré dans le manifeste web, le manifeste
Bubblewrap et la configuration Gradle TWA ; le mode immersif existant est gardé.
Le jeu web reste adaptable au portrait si le navigateur refuse le verrouillage.
Le package, le keystore et l'alias n'ont pas changé. Ne pas régénérer ni publier
un AAB avant validation de l'essai et contrôle sur téléphone physique.

## Vérification

`npm run check`, `npm run build`, `node scripts/check-onboarding.cjs`,
`node scripts/check-exploration.cjs`. Le dernier script contrôle les axes,
les diagonales, l'arrêt, les collisions, l'annulation tactile, la sauvegarde
isolée, le tutoriel et les écrans mobiles. Il produit des captures dans `.tools/`.
Les tests de navigateur ne remplacent pas un essai tactile sur téléphone réel.
