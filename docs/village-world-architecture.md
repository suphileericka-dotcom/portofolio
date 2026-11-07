# Villages et exploration - 1.0.35

La diversite repose sur des villages permanents, pas sur une regeneration du sol.
Les arbres et les petits decors utilisent leurs coordonnees, independamment du joueur.
Les changements de biome ne declenchent plus de bandeau. Le nom d'un village
apparait uniquement a son entree; les arrivees sont conservees dans la sauvegarde.

## Compatibilite

- Les anciens villages restent tous les 15000 unites, avec leur habitant et leur
  identifiant calcule a partir de leur position. Deux villages intermediaires
  portent l'espacement a 5000 unites.
- Les anciens identifiants de refuge restent resolus vers les villages d'origine.
- Douze identites combinent maisons, palettes, dispositions et monuments.
  Les activites existantes peuvent utiliser les points d'interet locaux.
  Ce sont des variantes finies combinees, pas une infinite de dessins uniques.
- Missions, inventaire et relations gardent leurs formats existants.
- Une enveloppe disponible est conservee dans `pendingLetter`, avec position et
  graine de mission. Une mission active, une recompense en attente ou une activite
  prioritaire empechent l'apparition d'une seconde enveloppe.
- Le calendrier des portails reste inchange (premier portail apres 15 minutes
  actives). L'indication hors ecran fonctionne aussi avec les controles actuels.
- Le reperage exige `scoutActivatedByPlayer`, defini uniquement par l'action du
  Carnet. Ramasser la cible termine le reperage. Les anciennes sauvegardes sans
  ce champ ne reactivent pas un cercle.

## Verification

`npm run check:villages` couvre identites, anciens emplacements, activites,
deplacement, pixels du decor, sauvegarde, activation manuelle et enveloppes.
Les suites `check-portals`, `check-village-activities`, `check-resident-story`,
`check-object-visuals` et `check-exploration` couvrent les interactions voisines.

## Android

La configuration Capacitor suivie par Git utilise versionCode 7 / versionName
1.0.35. L'ancien projet de publication local `bubblewrap-twa` utilisait 6 / 1.0.5;
ses configurations locales ont aussi ete preparees en 7 / 1.0.35. Ce dossier et
sa cle restent exclus de Git. La signature TWA exige les variables locales
`BOSQUET_KEYSTORE_PASSWORD` et `BOSQUET_KEY_PASSWORD` et la cle existante `upload`.
Ne pas remplacer cette cle ni publier sur Google Play sans confirmation.
