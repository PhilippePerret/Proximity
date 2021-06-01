### Utilisation d'un "busyer"

L'idée serait d'avoir une class (`Busyer`) qui s'occupe de voir si l'application est occupée ou non.

SOIT

Les méthodes envoient des `on` pour dire qu'elles sont occupées et des `off` pour dire qu'elles ont fini leur travail.

SOIT

On envoie carrément la méthode au `Busyer`, qui s'en charge complètement (se met sur `ON` quand il la lance et sur `OFF` quand elle se finit).
Celle-ci est peut-être un peu  trop "invasive".
