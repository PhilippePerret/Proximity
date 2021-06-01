# Proximity<br>Manuel développeur

# #Introduction

Ce document contient les informations pour le développement de l’application.

## Version 'jan2020', dite « simplifiée »

Dans cette version simplifiée, il n’est plus question de gérer les choses de façon complexe. Voici le processus général :

* l'application reçoit un texte
* elle le décompose en mots et en canons :
  * elle le décompose en paragraphes (`PParagraph`) ,
  * elle décompose chaque paragraphe en mots (`PMot`),
  * elle enregistre les données paragraphes et mots par fichier (`PFile`) où chaque fichier représente à peu près une page.
* elle traite les proximités et les enregistre
* elle affiche le texte complet en indiquant les proximités
  * chaque mot (même ceux qui ne sont pas en proximités) est mis dans un span qui contient l’indication de son canon,
  * quand on glisse la souris sur un mot en proximité, on fait apparaitre les données sur cette proximité,
  * quand on clique sur le mot en proximité, un menu s’ouvre, permettant entre autres choses de :
    * ignore cette proximité
    * remplacer cette proximité
    * supprimer définitivement le mot
  * quand on choisit de remplacer cette proximité, le nouveau mot est analysé, signalant notamment si le nouveau mot crée des proximités
* elle enregistre les nouvelles données.

> Noter un point très important : l’application s’utilise en parallèle du texte à modifier. En aucun cas elle ne reconstitue un texte final, en tout cas pour le moment. Notamment pour conserver les styles qui, pour le moment, même en markdown, complique trop la gestion de l’affichage et de la reconstitution du texte.



## Les Proximités

Les proximités correspondent aux instances `Proximity` et concernent chaque fois une paire de mots qui sont trop près.

### Enregistrement des données proximités

Les données proximités sont enregistrées pour savoir si une proximité est ignorée, corrigée, supprimée, etc.

