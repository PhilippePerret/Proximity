'use strict';
const DATA_OPERATIONS_CHECKER = {
  // 0->99 Opérations sur les fichiers

  // 100 -> 199 Opérations sur les paragraphes
    101: {err:'Mauvais identifiant de fichier dans le paragraphe (paragraphe:%{par}, fichier:%{fic})',  repare:'remove', hname: "Destruction de paragraphe"}
  , 102: {err:'Mauvais offset du premier paragraphe (%{offset} au lieu de 0)', repare: 'repare-offset-first', hname: "Rectification de l'offset de premier paragraphe"}
  , 103: {err:'Mauvais offset absolu (attendu:%{exp}, obtenu:%{par}, offset fichier:%{fic}, offset relatif paragraphe:%{rel})', repare: 'repare-reloffset', hname: "Rectification de l'offset du paragraphe"}
  , 104: {err:'Mauvaise longueur de paragraphe (attendu:%{exp}, paragraphe:%{par})', repare: 'repare-length', hname: "Rectification de la longueur du paragraphe"}
  // 200 -> 299 Opération sur les mots
  , 200: {fatal:true, err: 'Compte de mots incorrect (avec mot.next: %{next}, dans les paragraphes:%{parags})' }
  , 201: {fatal:true, err: 'Compte de mots incorrect (avec mot.next: %{next}, dans PMot.items: %{class})'}
  // 300 -> 399 Check, erreurs et opération sur les proximités
  , 300: {err: 'MotA de proximité non défini', reparable:false}
  , 301: {err: 'MotB de proximité non défini', reparable:false}
  , 302: {err: "MotA devrait être un PMot (classe éventuelle: '%{class}', type: '%{type}')", reparable:false}
  , 303: {err: "MotB devrait être un PMot (classe éventuelle: '%{class}', type: '%{type}')", reparable:false}
  , 304: {err: "Les canons de motA et motB (motA: '%{canonA}', motB: '%{canonB}')", reparable:false}
  , 305: {err: "Le canon '%{canon}' (#%{canonId}) ne connait pas le motA (#%{id}, '%{real}')", reparable:false}
  , 306: {err: "Le canon '%{canon}' (#%{canonId}) ne connait pas le motB (#%{id}, '%{real}')", reparable:false}
  , 307: {err: "Le canon '%{canon}' (#%{canonId}) n'est pas proximizable, il ne devrait pas générer de proximités", reparable:false}
  , 308: {err: "La motA (#%{id}) n'est pas proximizable", reparable:false}
  , 309: {err: "La motB (#%{id}) n'est pas proximizable", reparable:false}
  , 310: {err: "La distance entre le motA et le motB (%{dist}) devrait être inférieur ou égale à la distance minimale %{distM}", reparable:false}
  , 311: {err: "La proximité est mal réglée pour le motA (attendu: %{exp}, obtenu: %{id})", reparable:true, repare:'motA.repare(\'px_idN\', %{exp})'}
  , 312: {err: "La proximité est mal réglée pour le motB (attendu: %{exp}, obtenu: %{id})", reparable:true, repare:'motB.repare(\'px_idP\', %{exp})'}
}


module.exports = DATA_OPERATIONS_CHECKER
