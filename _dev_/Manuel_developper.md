# Proximity<br>Manuel développeur

## Présentation

L’application **Proximity** permet de gérer les proximités de mots gênantes dans un texte quelconque, surtout un roman.

Dans cette version `0.4` on ne passe plus du tout par le serveur (ruby) pour faire l’analyse du texte. Tout se fait en javascript côté client.

## Hiérarchie des éléments

* **{PTexte}**. Le texte complet, un roman  par exemple.

  * **{PFile}**. Un fichier, correspondant à une page
    * **{PParagraph}**. Un paragraphe, un ensemble de x mots (`{PMot}`) délimité par un retour charriot (qu'il ne contient pas dans son `originalText`).
      * **{PMot}**. Un mot, qui correspond à l’atom de **Proximity**, le plus petit élément.


Chaque élément hérite de la classe [`{PTextElement}`](#class-abstraite-ptextelement) qui possède certaines méthodes et propriétés permettant de gérer plus facilement les pages.



## Préparation d’un texte

Lorsqu’on charge pour la première fois un texte dans l’application, ce texte est « préparé » pour être utilisé par l’application, c’est-à-dire, principalement qu’il est  découpé en cahiers, pages, paragraphes et mots.

Le texte est préparé par le module `module/preparator.js` qui va produire les fichiers et dossier (`<folder>` est le dossier du texte initial) :

~~~javascript
PTexte.textDataPath			<folder>/.<affixe>_prox/text_data.json
PTexte.proxDataPath			<folder>/.<affixe>_prox/prox_data.json
~~~



## Classe abstraite `{PTextElement}`

###Pré-requis

Chaque classe qui hérite de cette classe abstraite doit définir :

`consoleColor`. La couleur qui sera utilisée pour afficher les messages de cette classe dans la console.

`calcAbsOffset()`. Une méthode qui doit retourner l’offset (décalage) absolu de l’élément dans le texte.

### Propriété et méthode de classe héritables

`log(msg)`. Permet d’écrire un message de suivant en console avec une entête propre.

`get(<id>)`. Retourne l’instance `id`.

> Cette instance est définie car à l’instanciation de toute classe `PTextElement`, on ajoute cette instance à la liste des `items` de la classe (qui ne sont pas à confondre avec les `items` de l’instance, qui sont ses enfants).

`current`. Retourne le text-element courant.

`current = <item>`. Définit l’élément courant. Si une méthode `static onSetCurrent()` est définie, on l’appelle après avoir défini l’élément courant. Si une méthode `static beforeSetCurrent()` est définie, on l’appelle *avant* de redéfinir la valeur courante (permet par exemple de faire un traitement sur l’élément courant précédent).

`addItem(<instance>)`. Ajoute un item à la classe. Par exemple ajoute une  `{PPage}` à la classe `{PPage}`.

> Cette méthode n’est pas à confondre avec la même méthode d’instance.

* Noter que si l’identifiant de l’élément n’est pas défini, on le calcule automatiquement.

`items`. Retourne la <u>table</u> des items. Attention : contrairement à `#items` (qui est un `Array`), cette propriété est un dictionnaire (une table) avec en clé l’identifiant de l’élément. Utiliser `itemsList` pour obtenir une liste.

`itemsList`. Liste `Array` des instances de la classe.

`forEach(methode)` ou `forEachItem(methode)`.  Joue la méthode `methode` sur chaque élément de la classe. `methode` reçoit en premier argument l’instance de l'élément en question.

`count`. Retourne la liste d’instances.

### Propriétés /méthodes d’instance héritables

`log(msg)`. Permet d’écrire un message de suivant en console avec une entête propre.

`div`. Le HTML Element de l’élément dans l’interface. Il est construit par une méthode `build()` qui doit être définie pour chaque type d’élément.

`parent`. L’élément parent (récupéré grâce à la propriété `_parentId` et `classParent` qui définit la classe du parent — chaque classe qui hérite de `PTextElement` doit définir la propriété `classParent`).

`forJSON`. Retourne les données de l'élément en version `JSON` pour enregistrement avec `IO` (sauvegarde et chargement des fichiers volumineux). C'est une méthode commune à toutes les classes qui héritent de `PTextElement`.

`fromJSON`. Pour la lecture des données enregistrées à l’aide de la méthode `forJSON`.

`newId()`. Retourne un nouvel identifiant pour l’élément.

`absOffset`. Offset absolu de la partie dans le texte. Calculé d’après son offset relatif et l’offset de son parent. La classe héritante doit définir la méthode `calcAbsOffset()`.

`relOffset`. Offset relatif de l’élément dans son parent. C’est le décalage d’un mot dans son paragraphe. Dans le fichier : `ro`.

`items`. `{Array}` des éléments enfants. Par exemple pour un cahier, les *items* sont des pages, pour une page, les *items* sont des paragraphes et pour des paragraphes les *items* sont des mots.

`tableItems`. Table `{Object}` est `items` de l’élément, avec en clé leur identifiant.

`addItem(<instance>)`. Ajoute un item à l’élément. Noter que la méthode définit la propriété `indexInParent` de l’item.

`contents`. Le contenu textuel de l’élément, calculé d’après ses `items`.

`indexInParent`. Index de l’élément dans le parent, défini par la méthode `addItem` ou retrouvé à la volée si nécessaire.

## Classe `PTexte`

Classe du texte travaillé. Elle hérite de `PTextElement`.

### États possibles d’un texte

* `isTextPrepared`. `true` quand le texte est préparé pour l’application Proximity, c’est-à-dire qu’il possède son dossier caché `./.<nom texte>_prox` dans le dossier du texte.

## Classe `PPage`

C’est la classe des pages du texte (pour rappel, le texte est découpé en cachiers de 16 pages, en pages de paragraphes et enfin en paragraphes de mots).

### État possible d’une page

Une `PPage` peut connaitre les états suivants :

* `isShowed`. Si `true`, la page est affichée.
* `isPrepared`. Si `true`, la page est complètement prête, même au niveau de ses proximités.
* `isFed`. Si `true`, la page est `nourrie`, c’est-à-dire que ses paragraphes (et les mots des paragraphes) ont été inscrit dans l’interface (même s’ils sont cachés pour le moment).
* `isBuilt`. True si la page est construite. Note : la différence entre `built` et `fed` est simple : `built` ne concerne que le container de la page, son div principal alors que pour être nourrie (`fed`), page doit posséder tous ses éléments.
* `isLoaded`. Si `true`, la page est « chargée » c’est-à-dire qu’elle connait ses `items`, les paragraphes. Dans le cas contraire, il faut la charger avec sa méthode `load`.
* `pagesAroundAreFed`. Est à `true` si les pages autour de la page sont préparées, c’est-à-dire qu’elles sont chargées (`loaded`) et nourries (`fed`).



### Fonctionnement

Au moment où on charge une page, ses paragraphes sont définis (`PPage#items` contient ses instances `{PPhrase}`) mais les paragraphes ne connaissent pas encore leurs `items` (les mots), seulement leur `_itemsIds`. Il faudra charger la page `page-xx.json` pour connaitre les données des mots.
