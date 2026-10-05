# Audit et identité graphique des objets

Catalogue extrait des données du jeu : 120 objets, plus Fleur sauvage utilisée par les missions. Aucun nom, ID, usage ou objet n'a été supprimé ou modifié. « Cookie vide » ne figure pas dans les données : l'objet existant est « Coque vide », dessiné comme une coque ouverte, sans créer un biscuit absent du catalogue.

## Avant la correction

Le monde utilisait des branches Canvas de drawCollectibleIcon ; le Carnet utilisait des formes CSS distinctes sélectionnées par getItemVisualType. Les 120 objets étaient ramenés à 12 familles, dont 14 feuilles (avec branches/fougères), 12 cônes (avec noix/graines), 11 outils génériques, 25 charmes. La couleur du charme au sol dépendait même de son index de rendu. Les noms ci-dessous sont reproduits tels qu'ils figurent dans les données.

## Source commune

objectVisuals contient les tracés vectoriels, la catégorie et les particularités de chaque ID. renderObjectVisual utilise exactement ces tracés et leurs styles pour le Canvas ou pour le SVG. drawCollectibleIcon et getItemIcon passent par ce rendu commun ; les fiches, Carnet, objets de mission et récompenses réutilisent ces fonctions. Les ombres au sol sont uniquement un effet de placement. getItemVisualType reste en place pour les règles de jeu, les usages et les indications : les illustrations ne dépendent plus de cette classification.

L'animation de collecte conserve maintenant le tracé de l'objet ramassé pendant sa montée et son fondu, en complément des particules existantes. La fiche de mission affiche aussi la même icône pour son objet cible.

## Validation

`node scripts/check-object-visuals.cjs` vérifie les 121 définitions, l'absence de géométries complètes identiques, la validité des tracés, la correspondance des pixels SVG/Canvas et la résolution des ID d'objets apparus dans le monde. Les scénarios couvrent le ramassage réel, son animation, le Carnet, les missions, les récompenses, le déplacement et la sauvegarde, en Chromium à 1280 × 800, 390 × 844 et 844 × 390.

La planche `.tools/objects/catalogue.png` présente tout le catalogue en couleur et en gris ; elle permet de comparer les silhouettes sans dépendre des teintes. Les contrôles tactiles, le compagnon, la barre supérieure, les ponts et le correctif du saut au démarrage ont également été revérifiés. Il s'agit de tests de navigateur avec mobile simulé, pas de tests sur téléphone physique.

## Catalogue complet

ID | Objet | Catégorie | Ancien visuel monde / Carnet | Nouveau visuel | Ce qui le différencie | Doublon ancien
---|---|---|---|---|---|---
leaf | Feuille nervuree | Nature · feuille | Feuille generique (aussi branches et fougeres) / CSS leaf | Feuille allongée et dentelée | nervure centrale et nervures latérales | 14 objets
stone | Pierre polie | Nature · pierre | Galet ovale generique / CSS stone | Galet horizontal poli avec reflet et petite strie | Galet horizontal poli avec reflet et petite strie | 14 objets
feather | Plume claire | Nature · plume | Plume generique / CSS feather | Plume claire incurvée | barbes découpées et rachis dépassant | 5 objets
moss | Statue moussue | Patrimoine · sculpture | Cristal pentagonal generique / CSS rare | Buste sculpté avec visage | socle et mousse sur les épaules | 9 objets
shell | Coquille de riviere | Nature · coquille | Coquillage en eventail generique / CSS shell | Coquille de rivière en spirale | silhouette arrondie et ouverture | 5 objets
cone | Pomme de pin bleue | Nature · cône | Pomme de pin generique (aussi noix et graines) / CSS cone | Pomme de pin verticale en goutte avec huit écailles imbriquées | Pomme de pin verticale en goutte avec huit écailles imbriquées | 12 objets
mushroom | Champignon lumineux | Nature · champignon | Champignon a chapeau dore generique / CSS mushroom | Chapeau lumineux ouvert et retombant | lamelles, pied fin et halo | 3 objets
star | Etoile tombee | Céleste | Etoile a cinq branches generique / CSS star | Étoile tombée à cinq branches | pointe cassée et cœur lumineux | 7 objets
item-1 | Feuille d'argent | Nature · feuille | Feuille generique (aussi branches et fougeres) / CSS leaf | Feuille d’argent fine en croissant | pointe recourbée et reflets | 14 objets
item-2 | Fleur de trefle | Nature · fleur | Fleur a quatre petales generique / CSS flower | Trèfle à trois feuilles en cœur et petite fleur sur tige | Trèfle à trois feuilles en cœur et petite fleur sur tige | 11 objets
item-3 | Branche souple | Nature · bois | Feuille generique (aussi branches et fougeres) / CSS leaf | Branche souple en arc avec fourche et deux bourgeons | Branche souple en arc avec fourche et deux bourgeons | 14 objets
item-4 | Pierre de lune | Nature · pierre | Galet ovale generique / CSS stone | Pierre de lune en croissant évidé | Pierre de lune en croissant évidé | 14 objets
item-5 | Galet rieur | Nature · pierre | Galet ovale generique / CSS stone | Galet ovoïde debout avec visage souriant gravé | Galet ovoïde debout avec visage souriant gravé | 14 objets
item-6 | Roseau siffleur | Nature · roseau | Feuille generique (aussi branches et fougeres) / CSS leaf | Roseau long à trois nœuds et ouverture de sifflet | Roseau long à trois nœuds et ouverture de sifflet | 14 objets
item-7 | Fleur d'averse | Nature · fleur | Fleur a quatre petales generique / CSS flower | Fleur d’averse penchée | trois pétales en gouttes | 11 objets
item-8 | Baie douce | Nature · fruit | Capsule coloree selon son index au sol / CSS charm | Grappe de trois baies charnues attachées à une petite feuille | Grappe de trois baies charnues attachées à une petite feuille | 25 objets
item-9 | Noisette claire | Nature · noix | Pomme de pin generique (aussi noix et graines) / CSS cone | Noisette claire ronde | cupule courte et coque striée | 12 objets
item-10 | Ecorce fine | Nature · bois | Feuille generique (aussi branches et fougeres) / CSS leaf | Bande d’écorce enroulée | bords irréguliers et fibres | 14 objets
item-11 | Plume blanche | Nature · plume | Plume generique / CSS feather | Grande plume blanche étroite | barbes symétriques en peigne | 5 objets
item-12 | Coquillage dore | Nature · coquillage | Coquillage en eventail generique / CSS shell | Coquillage doré en éventail à cinq festons et côtes radiales | Coquillage doré en éventail à cinq festons et côtes radiales | 5 objets
item-13 | Champignon bleu | Nature · champignon | Champignon a chapeau dore generique / CSS mushroom | Petit champignon bleu à chapeau rond | pied court et clair | 3 objets
item-14 | Grain de pollen | Nature · pollen | Capsule coloree selon son index au sol / CSS charm | Grain de pollen hérissé de six excroissances et granules | Grain de pollen hérissé de six excroissances et granules | 25 objets
item-15 | Fougère pliee | Nature · fougère | Feuille generique (aussi branches et fougeres) / CSS leaf | Fronde repliée en crosse | folioles alternées | 14 objets
item-16 | Morceau d'ambre | Nature · résine | Galet ovale generique / CSS stone | Ambre trapézoïdal translucide avec inclusion végétale | Ambre trapézoïdal translucide avec inclusion végétale | 14 objets
item-17 | Ruban de lierre | Nature · lierre | Cristal pentagonal generique / CSS rare | Ruban de lierre sinueux avec trois feuilles triangulaires | Ruban de lierre sinueux avec trois feuilles triangulaires | 9 objets
item-18 | Bouton de rose | Nature · bouton floral | Fleur a quatre petales generique / CSS flower | Rose fermée en ogive avec sépales serrés | Rose fermée en ogive avec sépales serrés | 11 objets
item-19 | Clochette seche | Nature · fleur sèche | Capsule coloree selon son index au sol / CSS charm | Clochette végétale sèche suspendue à une tige courbe | Clochette végétale sèche suspendue à une tige courbe | 25 objets
item-20 | Perle de rosée | Nature · eau | Capsule coloree selon son index au sol / CSS charm | Perle de rosée ronde posée sur un calice à trois pointes | Perle de rosée ronde posée sur un calice à trois pointes | 25 objets
item-21 | Carte fragile | Fabriqué · carte | Rectangle de papier a lignes / CSS paper | Carte fragile déchirée aux bords | chemin et croix | 4 objets
item-22 | Fragment de tuile | Fabriqué · tuile | Cristal pentagonal generique / CSS rare | Fragment de tuile courbe avec cassure en dents | Fragment de tuile courbe avec cassure en dents | 9 objets
item-23 | Clef de mousse | Fabriqué · clef | Tige diagonale avec deux ronds / CSS tool | Clef de mousse à anneau carré | dents et mousse | 11 objets
item-24 | Fiole de brume | Fabriqué · fiole | Tige diagonale avec deux ronds / CSS tool | Fiole ronde à col étroit contenant deux volutes de brume | Fiole ronde à col étroit contenant deux volutes de brume | 11 objets
item-25 | Boussole fatiguee | Fabriqué · boussole | Tige diagonale avec deux ronds / CSS tool | Boussole ovale cabossée avec aiguille inclinée et fissure | Boussole ovale cabossée avec aiguille inclinée et fissure | 11 objets
item-26 | Lanterne miniature | Fabriqué · lanterne | Tige diagonale avec deux ronds / CSS tool | Petite lanterne à anse | toit pointu et fenêtre lumineuse | 11 objets
item-27 | Bout de ficelle | Fabriqué · ficelle | Cristal pentagonal generique / CSS rare | Bout de ficelle beige noué | boucle et deux extrémités | 9 objets
item-28 | Pomme rouge | Nature · fruit | Capsule coloree selon son index au sol / CSS charm | Pomme rouge bilobée avec creux | queue et feuille | 25 objets
item-29 | Sachet de graines | Fabriqué · sachet | Pomme de pin generique (aussi noix et graines) / CSS cone | Sachet de graines resserré par un lien | graines dessinées | 12 objets
item-30 | Petit miroir | Fabriqué · miroir | Tige diagonale avec deux ronds / CSS tool | Miroir à main rond et poignée évasée | Miroir à main rond et poignée évasée | 11 objets
item-31 | Cristal de pluie | Nature · cristal | Galet ovale generique / CSS stone | Cristal de pluie en aiguille à deux pointes latérales | Cristal de pluie en aiguille à deux pointes latérales | 14 objets
item-32 | Graine ancienne | Nature · graine | Pomme de pin generique (aussi noix et graines) / CSS cone | Graine ancienne allongée avec coque entrouverte et germe | Graine ancienne allongée avec coque entrouverte et germe | 12 objets
item-33 | Fleur eternelle | Nature · fleur | Fleur a quatre petales generique / CSS flower | Fleur éternelle à six pétales anguleux et deux feuilles | Fleur éternelle à six pétales anguleux et deux feuilles | 11 objets
item-34 | Boussole enchantee | Fabriqué · boussole | Tige diagonale avec deux ronds / CSS tool | Boussole enchantée hexagonale avec rune et double aiguille | Boussole enchantée hexagonale avec rune et double aiguille | 11 objets
item-35 | Papillon de verre | Fabriqué · verre | Capsule coloree selon son index au sol / CSS charm | Papillon en verre | quatre ailes facettées asymétriques | 25 objets
item-36 | Eclat de soleil | Céleste | Etoile a cinq branches generique / CSS star | Éclat de soleil en éventail à trois rayons larges | Éclat de soleil en éventail à trois rayons larges | 7 objets
item-37 | Couronne de fougere | Fabriqué · couronne végétale | Feuille generique (aussi branches et fougeres) / CSS leaf | Couronne de fougère ouverte avec frondes en pointes | Couronne de fougère ouverte avec frondes en pointes | 14 objets
item-38 | Silex chanteur | Nature · silex | Galet ovale generique / CSS stone | Silex triangulaire taillé avec arêtes et petites ondes | Silex triangulaire taillé avec arêtes et petites ondes | 14 objets
item-39 | Charme de vent | Fabriqué · charme | Capsule coloree selon son index au sol / CSS charm | Charme de vent suspendu à un anneau | trois rubans flottants | 25 objets
item-40 | Plume d'aurore | Nature · plume | Plume generique / CSS feather | Plume d’aurore asymétrique allongée | pointe bifide et barbes étagées | 5 objets
item-41 | Bouton de manteau | Fabriqué · bouton | Capsule coloree selon son index au sol / CSS charm | Bouton de manteau large | quatre trous et bord épais | 25 objets
item-42 | Tasse fendue | Fabriqué · vaisselle | Cristal pentagonal generique / CSS rare | Tasse fendue avec anse et fissure en zigzag | Tasse fendue avec anse et fissure en zigzag | 9 objets
item-43 | Jeton de village | Fabriqué · jeton | Capsule coloree selon son index au sol / CSS charm | Jeton de village octogonal avec maison gravée | Jeton de village octogonal avec maison gravée | 25 objets
item-44 | Clou dore | Fabriqué · clou | Capsule coloree selon son index au sol / CSS charm | Clou doré diagonal avec tête aplatie et pointe | Clou doré diagonal avec tête aplatie et pointe | 25 objets
item-45 | Pinceau sec | Fabriqué · pinceau | Pomme de pin generique (aussi noix et graines) / CSS cone | Pinceau sec | manche long, virole et poils écartés | 12 objets
item-46 | Note pliee | Fabriqué · note | Rectangle de papier a lignes / CSS paper | Note pliée triangulaire | rabat et petite ligne manuscrite | 4 objets
item-47 | Sifflet de bois | Fabriqué · sifflet | Cristal pentagonal generique / CSS rare | Sifflet de bois oblong avec embouchure et trou sombre | Sifflet de bois oblong avec embouchure et trou sombre | 9 objets
item-48 | Cordelette bleue | Fabriqué · corde | Capsule coloree selon son index au sol / CSS charm | Cordelette bleue tressée en double boucle et extrémités | Cordelette bleue tressée en double boucle et extrémités | 25 objets
item-49 | Herbier vierge | Fabriqué · carnet | Capsule coloree selon son index au sol / CSS charm | Herbier vierge rectangulaire | dos relié et pages claires | 25 objets
item-50 | Pendentif simple | Fabriqué · pendentif | Capsule coloree selon son index au sol / CSS charm | Cordon en V avec pendentif ovale et bélière | Cordon en V avec pendentif ovale et bélière | 25 objets
item-51 | Fleur de neige | Nature · fleur | Fleur a quatre petales generique / CSS flower | Fleur de neige à six pétales pointus autour d’un cœur glacé | Fleur de neige à six pétales pointus autour d’un cœur glacé | 11 objets
item-52 | Galet noir | Nature · pierre | Galet ovale generique / CSS stone | Galet noir bas et irrégulier avec bande minérale claire | Galet noir bas et irrégulier avec bande minérale claire | 14 objets
item-53 | Bois flotte | Nature · bois | Capsule coloree selon son index au sol / CSS charm | Bois flotté long et blanchi | bouts arrondis et nœud | 25 objets
item-54 | Champignon doux | Nature · champignon | Champignon a chapeau dore generique / CSS mushroom | Champignon doux trapu | chapeau plat brun et gros pied | 3 objets
item-55 | Feuille rouge | Nature · feuille | Feuille generique (aussi branches et fougeres) / CSS leaf | Feuille rouge automnale large à cinq lobes | Feuille rouge automnale large à cinq lobes | 14 objets
item-56 | Pierre plate | Nature · pierre | Galet ovale generique / CSS stone | Pierre plate en dalle très basse avec tranche visible | Pierre plate en dalle très basse avec tranche visible | 14 objets
item-57 | Mousse de pont | Nature · mousse | Cristal pentagonal generique / CSS rare | Touffe de mousse sur petit support avec pousses rondes | Touffe de mousse sur petit support avec pousses rondes | 9 objets
item-58 | Aiguille de pin | Nature · aiguille | Pomme de pin generique (aussi noix et graines) / CSS cone | Trois aiguilles de pin longues reliées par un court étui | Trois aiguilles de pin longues reliées par un court étui | 12 objets
item-59 | Coque vide | Nature · coque | Coquillage en eventail generique / CSS shell | Coque vide ouverte en deux valves | intérieur concave | 5 objets
item-60 | Grain de sable | Nature · minéral | Capsule coloree selon son index au sol / CSS charm | Grain de sable anguleux | trois facettes visibles | 25 objets
item-61 | Etoffe verte | Fabriqué · textile | Capsule coloree selon son index au sol / CSS charm | Étoffe verte pliée avec ourlet et bord effiloché | Étoffe verte pliée avec ourlet et bord effiloché | 25 objets
item-62 | Bague de cuivre | Fabriqué · bijou | Tige diagonale avec deux ronds / CSS tool | Bague de cuivre en anneau épais avec chaton carré | Bague de cuivre en anneau épais avec chaton carré | 11 objets
item-63 | Medaille sans nom | Fabriqué · médaille | Tige diagonale avec deux ronds / CSS tool | Médaille ronde suspendue à un ruban fourchu | sans inscription | 11 objets
item-64 | Petale nacre | Nature · pétale | Fleur a quatre petales generique / CSS flower | Pétale nacré isolé en cœur asymétrique | nervures rayonnantes | 11 objets
item-65 | Baton de marche | Fabriqué · bâton | Capsule coloree selon son index au sol / CSS charm | Bâton de marche à poignée recourbée et grip strié | Bâton de marche à poignée recourbée et grip strié | 25 objets
item-66 | Epi sauvage | Nature · graminée | Capsule coloree selon son index au sol / CSS charm | Épi sauvage vertical à grains alternés et longues barbes | Épi sauvage vertical à grains alternés et longues barbes | 25 objets
item-67 | Larme d'orage | Nature · eau | Cristal pentagonal generique / CSS rare | Larme d’orage en goutte large avec éclair intérieur | Larme d’orage en goutte large avec éclair intérieur | 9 objets
item-68 | Fragment d'etoile | Céleste | Etoile a cinq branches generique / CSS star | Fragment d’étoile triangulaire à une pointe et cassure crantée | Fragment d’étoile triangulaire à une pointe et cassure crantée | 7 objets
item-69 | Fleur de minuit | Nature · fleur | Fleur a quatre petales generique / CSS flower | Fleur de minuit en corolle spiralée de cinq pétales | Fleur de minuit en corolle spiralée de cinq pétales | 11 objets
item-70 | Sceau ancien | Fabriqué · sceau | Rectangle de papier a lignes / CSS paper | Sceau ancien en cachet à manche et base gravée | Sceau ancien en cachet à manche et base gravée | 4 objets
item-71 | Cloche miniature | Fabriqué · cloche | Capsule coloree selon son index au sol / CSS charm | Cloche miniature métallique | anneau et battant | 25 objets
item-72 | Poussiere de carte | Fabriqué · papier | Rectangle de papier a lignes / CSS paper | Poussière de carte en cinq fragments dont deux avec tracés | Poussière de carte en cinq fragments dont deux avec tracés | 4 objets
item-73 | Craie blanche | Fabriqué · craie | Capsule coloree selon son index au sol / CSS charm | Craie blanche cylindrique couchée et bout cassé | Craie blanche cylindrique couchée et bout cassé | 25 objets
item-74 | Tambourin muet | Fabriqué · instrument | Capsule coloree selon son index au sol / CSS charm | Tambourin circulaire avec membrane et quatre cymbalettes | Tambourin circulaire avec membrane et quatre cymbalettes | 25 objets
item-75 | Bouton de nacre | Fabriqué · bouton | Capsule coloree selon son index au sol / CSS charm | Bouton de nacre ovale à deux trous | irisation et bord fin | 25 objets
item-76 | Gemme de source | Nature · gemme | Galet ovale generique / CSS stone | Gemme de source facettée en losange à large sommet | Gemme de source facettée en losange à large sommet | 14 objets
item-77 | Rune lisse | Nature · rune | Galet ovale generique / CSS stone | Rune gravée dans une pierre rectangulaire arrondie | Rune gravée dans une pierre rectangulaire arrondie | 14 objets
item-78 | Bocal de lucioles | Fabriqué · bocal | Etoile a cinq branches generique / CSS star | Bocal de lucioles à couvercle large | insectes et halos | 7 objets
item-79 | Aile transparente | Nature · aile | Plume generique / CSS feather | Aile transparente de libellule | étirée et veinée en réseau | 5 objets
item-80 | Goutte suspendue | Nature · eau | Capsule coloree selon son index au sol / CSS charm | Goutte suspendue à un filament fin avec reflet courbe | Goutte suspendue à un filament fin avec reflet courbe | 25 objets
item-81 | Fleur de colline | Nature · fleur | Fleur a quatre petales generique / CSS flower | Fleur de colline à cinq pétales ronds | longue tige inclinée | 11 objets
item-82 | Sapin miniature | Nature · arbre | Pomme de pin generique (aussi noix et graines) / CSS cone | Sapin miniature à trois étages triangulaires et tronc | Sapin miniature à trois étages triangulaires et tronc | 12 objets
item-83 | Feuille de saule | Nature · feuille | Feuille generique (aussi branches et fougeres) / CSS leaf | Feuille de saule longue | étroite et retombante | 14 objets
item-84 | Coquille bleue | Nature · coquille | Coquillage en eventail generique / CSS shell | Coquille bleue conique à trois tours et ouverture basse | Coquille bleue conique à trois tours et ouverture basse | 5 objets
item-85 | Pierre chaude | Nature · pierre | Galet ovale generique / CSS stone | Pierre chaude en bloc haut | fissures et veines orangées | 14 objets
item-86 | Branche etoilee | Nature · bois | Feuille generique (aussi branches et fougeres) / CSS leaf | Branche étoilée à cinq ramifications ligneuses | Branche étoilée à cinq ramifications ligneuses | 14 objets
item-87 | Plume sombre | Nature · plume | Plume generique / CSS feather | Plume sombre inclinée | bord cranté et pointe effilée | 5 objets
item-88 | Baie d'hiver | Nature · fruit | Capsule coloree selon son index au sol / CSS charm | Baie d’hiver solitaire | calice étoilé et deux feuilles piquantes | 25 objets
item-89 | Herbe de pluie | Nature · herbe | Feuille generique (aussi branches et fougeres) / CSS leaf | Herbe de pluie à cinq brins arqués et gouttelettes | Herbe de pluie à cinq brins arqués et gouttelettes | 14 objets
item-90 | Morceau de nuage | Céleste | Capsule coloree selon son index au sol / CSS charm | Morceau de nuage en touffe douce à base plate et petites volutes | Morceau de nuage en touffe douce à base plate et petites volutes | 25 objets
item-91 | Cristal d'aube | Nature · cristal | Galet ovale generique / CSS stone | Cristal d’aube en bouquet de trois prismes inégaux | Cristal d’aube en bouquet de trois prismes inégaux | 14 objets
item-92 | Fleur solaire | Nature · fleur | Fleur a quatre petales generique / CSS flower | Fleur solaire à dix pétales fins | cœur large et deux feuilles | 11 objets
item-93 | Graine de chemin | Nature · graine | Pomme de pin generique (aussi noix et graines) / CSS cone | Graine de chemin ailée en samare avec noyau décentré | Graine de chemin ailée en samare avec noyau décentré | 12 objets
item-94 | Boussole des mousses | Fabriqué · boussole | Tige diagonale avec deux ronds / CSS tool | Boussole des mousses ronde avec lichen et aiguille végétale | Boussole des mousses ronde avec lichen et aiguille végétale | 11 objets
item-95 | Etoile de poche | Céleste | Etoile a cinq branches generique / CSS star | Étoile de poche compacte à six branches dans une pochette | Étoile de poche compacte à six branches dans une pochette | 7 objets
item-96 | Clef de racine | Fabriqué · clef | Tige diagonale avec deux ronds / CSS tool | Clef de racine à anneau torsadé et dents ramifiées | Clef de racine à anneau torsadé et dents ramifiées | 11 objets
item-97 | Fiole de vent | Fabriqué · fiole | Tige diagonale avec deux ronds / CSS tool | Fiole de vent haute avec base étroite et spirale intérieure | Fiole de vent haute avec base étroite et spirale intérieure | 11 objets
item-98 | Carte des lucioles | Fabriqué · carte | Etoile a cinq branches generique / CSS star | Carte des lucioles pliée en accordéon | constellation tracée | 7 objets
item-99 | Couronne ancienne | Fabriqué · couronne | Cristal pentagonal generique / CSS rare | Couronne ancienne à trois fleurons et bande gravée | Couronne ancienne à trois fleurons et bande gravée | 9 objets
item-100 | Soleil tombe | Céleste | Etoile a cinq branches generique / CSS star | Soleil tombé en disque fendu entouré de huit rayons courts | Soleil tombé en disque fendu entouré de huit rayons courts | 7 objets
spring-bloom | Fleur de printemps | Nature · fleur saisonnière | Fleur a quatre petales generique / CSS flower | Fleur de printemps à quatre pétales en cœur | bourgeon latéral | 11 objets
summer-shell | Coquillage d'ete | Nature · coquillage saisonnier | Coquillage en eventail generique / CSS shell | Coquillage d’été spiralé très allongé | cinq tours | 5 objets
autumn-maple | Feuille d'automne | Nature · feuille saisonnière | Feuille generique (aussi branches et fougeres) / CSS leaf | Feuille d’automne palmée à sept pointes aiguës et long pétiole | Feuille d’automne palmée à sept pointes aiguës et long pétiole | 14 objets
winter-crystal | Cristal d'hiver | Nature · cristal saisonnier | Galet ovale generique / CSS stone | Cristal d’hiver en flocon hexagonal ramifié | Cristal d’hiver en flocon hexagonal ramifié | 14 objets
tree-micro-1 | Feuille particuliere | Nature · feuille | Feuille generique (aussi branches et fougeres) / CSS leaf | Feuille particulière ovale simple avec encoche latérale | Feuille particulière ovale simple avec encoche latérale | 14 objets
tree-micro-2 | Graine ronde | Nature · graine | Pomme de pin generique (aussi noix et graines) / CSS cone | Graine ronde cerclée d’un sillon et ombilic | Graine ronde cerclée d’un sillon et ombilic | 12 objets
tree-micro-3 | Petit fruit doux | Nature · fruit | Fleur a quatre petales generique / CSS flower | Petit fruit doux piriforme avec queue et petite feuille | Petit fruit doux piriforme avec queue et petite feuille | 11 objets
tree-micro-4 | Brindille claire | Nature · bois | Feuille generique (aussi branches et fougeres) / CSS leaf | Brindille claire à trois fourches fines et bourgeon terminal | Brindille claire à trois fourches fines et bourgeon terminal | 14 objets
rolling-micro-1 | Gland poli | Nature · noix | Pomme de pin generique (aussi noix et graines) / CSS cone | Gland poli allongé avec cupule écailleuse et pédoncule | Gland poli allongé avec cupule écailleuse et pédoncule | 12 objets
rolling-micro-2 | Noisette roulante | Nature · noix | Pomme de pin generique (aussi noix et graines) / CSS cone | Noisette roulante couchée | cupule latérale et fissure | 12 objets
rolling-micro-3 | Galet leger | Nature · pierre | Galet ovale generique / CSS stone | Galet léger presque circulaire avec trou et stries | Galet léger presque circulaire avec trou et stries | 14 objets
rolling-micro-4 | Graine de chemin | Nature · graine | Pomme de pin generique (aussi noix et graines) / CSS cone | Graine de chemin roulante ovale | deux ailettes et couture | 12 objets
wild-flower | Fleur sauvage | Nature · fleur de mission | Fleur a quatre petales generique / CSS flower | Fleur sauvage à cinq pétales espacés et deux petites feuilles | Fleur sauvage à cinq pétales espacés et deux petites feuilles | 11 objets
