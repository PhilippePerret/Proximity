


Nouvelle formule à essayer :

Quand un paragraphe est modifié
- je prends le texte autour (en prenant les mots avec leur identifiant) jusqu'à atteindre la distance maximale, avant et après
- je détruis tous les mots (instances) du paragraphe modifié
- je prends seulement le texte du paragraphe modifié
- j'envoie tout ça à l'analyse (en indique l'id du dernier mot utilisé)
- l'analyse attribut de nouvelles instances aux mot du paragraphe
-

On envoie quelque chose comme ça :

Les données des mots précédents
[
    {start:<offset début mot>, end:<offset end mot>, mot:<le mot>, canon:<canon>, id:<son identifiant>}
  , {start:<offset début mot>, end:<offset end mot>, mot:<le mot>, canon:<canon>, id:<son identifiant>}
  , {start:<offset début mot>, end:<offset end mot>, mot:<le mot>, canon:<canon>, id:<son identifiant>}
]

<!-- Le paragraphe modifié -->
Comme un texte normal, qu'on analysera, pour trouver les canons et les offsets


Les données des mots suivants
[
  , {start:<offset début mot>, end:<offset end mot>, mot:<le mot>, canon:<canon>, id:<son identifiant>}
  , {start:<offset début mot>, end:<offset end mot>, mot:<le mot>, canon:<canon>, id:<son identifiant>}
]
