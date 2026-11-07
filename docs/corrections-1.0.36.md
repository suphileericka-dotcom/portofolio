# Corrections 1.0.36

- Suppression des couches purement decoratives `drawRegionGroundDecor` et
  `drawRegionAtmosphere`. Les objets collectables, plantations, missions et
  ambiances des mondes secrets conservent leurs propres fonctions.
- Cache-cache : trajet anime pendant les trois secondes de preparation,
  cachette existante accessible, recherche de 240 secondes, interaction de
  proximite, retour au village et nouvelle proposition garantie apres echec.
- Compte a rebours et chronometres places sous la barre de boutons. La
  boussole active est decalee pour ne pas les recouvrir.
- Aucun changement des modeles, emplacements ou dispositions des villages.
- Aucune mecanique de recolte deleguee aux habitants ajoutee.

## Verifications

Tests Chromium sur ordinateur, portrait 390x844 et paysage 844x390 : activites,
objets perdus, abris, compagnons, portails, mission du premier habitant,
inventaire, sauvegardes et villages. Le test des activites utilise une
identite navigateur Android et verifie les limites des commandes tactiles.
Captures locales dans `.tools/village/hide-search-*.png`.

Le cache-cache interrompu par une fermeture revient a l'etat de repos au
chargement, comme auparavant. L'objet perdu conserve sa progression.
La possibilite de rejouer apres un echec est sauvegardee.

La synchronisation des ressources Android ne constitue pas une validation
native ni une publication Google Play. Aucun nouvel AAB signe dans ce lot.
