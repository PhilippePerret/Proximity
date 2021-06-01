# Proximity<br>Manuel de Test



## Introduction

Les tests sont repensés complètement pour être totalement adapté à l’application (c’est-à-dire inutilisable dans une autre, à part certains modules comme `TestConsole.js` par exemple).

Un test est composé de deux fichiers :

- `<fichier>.txt`. Contient le texte qu’il faut charger dans l’application et analyser.
- `<fichier>.yaml`. Appelé **Fichier de définition du texte**. Contient la description la plus précise possible du texte ci-dessus, avec par exemple le nombre de mots, de canons, de proximités, les proximités qu’on doit trouver très précisément etc. et même des opérations à faire au cours du texte (remplacement de mots, etc.). Pour le détail de ce fichier, cf. [Fichier de définition du texte](#fichierdefinitiontexte)



## Description

- Dans l’absolu, aucune erreur de test n'est fatale. On pourra voir s’il est intéressant de modifier ce comportement. Il le sera certainement suite aux erreurs en cascade (par exemple un élément inexistant et ses propriétés pourtant vérifiées — il pourrait y avoir, en fait, des traitements spéciaux dans le code lui-même)
- Les messages consoles sont interceptés pour ne pas déranger les messages de tests. On peut néanmoins les afficher tous après un test grâce à la commande `TConsole.showAllMessages()`.



## Lancement des tests

Il suffit de jouer dans la console :

~~~sh
> npm run tests
~~~



### Exclure et inclure des tests

Pour inclure des tests, il suffit que leur dossier parent commencer par `+`.

Pour exclure un test, il suffit que son dossier parent commence par `-`.

Noter qu’en l’absence d’un signe `+` ou `-` le comportement des tests est « normal », donc tous les tests sont joués. Mais :

* Dès qu’on trouve un signe `-`, tous les autres tests sont joués, sauf si on trouve le signe `+` (cf. ci-dessous).
* Dès qu’on trouve un signe `+`, seuls les tests dont les dossiers commencent par `+` sont joués.



<a name="fichierdefinitiontexte"></a>

## Le Fichier de définition du texte

Ce fichier `YAML` définit le plus précisément possible la composition du texte auquel il est associé. Son texte associé porte le même affixe que lui, mais avec l’extension `.txt`.

La forme générale de ce fichier est :

~~~yaml
---
config:
	# ici la définition de la configuration générale (cf. [1])
mots:
	# ici la définition des mots
canons:
	# ici la définition des canons
proximites:
	# ici la définition des proximités
operations:
	# Ici la définition des opérations de test à faire, par 
	# exemple les remplacements de mots, etc.
	# C'est une liste
~~~



> Les opérations sont des données à part dont nous parlons [ci-dessous](#lesoperations).
>
> [1] cf.  [Configuration du test du texte](#configurationtesttexte)

`mots`, `canons` et `proximites` partagent de nombreuses propriétés à commencer par `nombre` et `items`

~~~yaml
---
mots:
	expose: false # si true, on renvoie en console l'état des mots
	nombre: 12 # le nombre de mots attendus
	null_items: [] # liste des ids supprimés (ou inexistants)
	items: # la liste des items à checker
		- id: 1
			real: 'Hello'
			canon: 'hello'
			tbw: ' '
		- id: 2
			real: 'le'
			canon: 'le'
			tbw: ' '
canons:
	expose: false # si true, on renvoie en console l'état actuel des canons
	nombre: 3
	null_items: [] # liste des ids supprimés (ou inexistants)
	items: # liste des canons à checker
		- id: 2
			# ici les propriétés propres aux canons
proximites:
	# idem
~~~

Comme indiqué, les propriétés dépendent de chaque élément. On trouve une propriété `real` seulement pour les mots (`PMot`) et une propriété `canon`  pour les mots (`PMot`) et les canons (`PCanon`)



<a name="configurationtesttexte"></a>

### Configuration du test du texte

En haut du fichier de définition du texte, on peut définir certains éléments de configuration :

~~~yaml
---
config:
	force_update: false # Si false et que le dossier prox existe déjà pour le
											# texte, alors on ne le refait pas.
	save_auto: false		# Si false, la sauvegarde automatique est retirée. Cela permet
											# en combinaison avec 'force_update', d'accélérer les tests en
											# partant d'un texte dont les modifications ne seront pas enre-
											# gistrées.
	debug: true/false/0-9		# Définit le niveau de débuggage. Noter que pour voir ces 
											# message il faut appeler la méthode showAllMessages() dans la
											# console à la fin des tests.
~~~



<a name="lesoperations"></a>

### Les opérations

Les trois premiers éléments `mots`, `canons` et `proximites` peuvent se retrouver dans d’autre partie, par exemple dans la propriété `before` ou `after` d’une opération. Par exemple :

~~~yaml
---
mots:
	nombre: 4
# ...
operations:
	- id: remplace_mots
		operation: replaceMots(3, 'Hello world')
		before:
			mots:
				nombre: 4
		after:
			mots:
				nombre: 5
  - id: autre_operation
  	# ... etc.
~~~



L’état défini dans `before` est l’état qui est vérifié avant d’exécuter l’opération. Si cet état n’est pas vérifié, l’opération n’est pas jouée.

L’état défini dans `after` est l’état vérifié après l’opération, si cette opération a réussi.



## Annexe développeur

Cette partie concerne l’implémentation des tests de **Proximity**.



### Voir tous les messages console

Pour afficher tous les messages console reçus, après les tests, jouer en console :

~~~sh
showAllMessages()
~~~





### Messages

Pour envoyer des messages à la console, on peut utiliser :

**Message de succès**

~~~javascript
TConsole.success("Le message de succès")
~~~

**Message d'échec**

~~~javascript
TConsole.failure("Message d'échec")
~~~

**Écrire un titre**

~~~javascript
TConsole.titlelize("Le titre")
~~~

**Message d'opération** (lorsqu’un opération a été lancée)

~~~javascript
TConsole.operation("L'opération lancée")
~~~

On peut également utiliser différentes méthodes comme `green` ou `red` pour mettre un texte en vert ou en rouge. Cf. le fichier `./tests_prox/lib/TestConsole.js` pour le listing exact.

 

**Message brut**

Ce message sera affiché tel quel :

~~~javascript
TConsole.raw("le message brut")
~~~

