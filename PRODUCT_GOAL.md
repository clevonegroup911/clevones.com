# PRODUCT_GOAL — clevones.com

## Objectif final

Livrer un produit CLEVONE réellement utilisable, cohérent, sécurisé, testé, exploitable et vérifiable, sans dépendre d'une relance manuelle permanente pour continuer le développement.

X200 AUTOPLAN doit poursuivre automatiquement le travail non sensible jusqu'à ce que les critères ci-dessous soient réellement satisfaits. Il ne doit jamais inventer une preuve, contourner une gate humaine sensible ni recréer une tâche déjà terminée.

## Critères de fin produit

Le produit n'est considéré comme fini que lorsque les éléments applicables sont prouvés sur l'état réel du dépôt et, pour les opérations externes, sur l'environnement concerné :

1. Site public principal fonctionnel, responsive, FR prioritaire avec EN disponible là où prévu.
2. Authentification et rôles opérationnels : SUPER_ADMIN, ADMIN, USER.
3. MFA administrateur opérationnelle selon la politique de sécurité.
4. CMS / back-office sécurisé opérationnel pour les fonctions prévues.
5. Gestion utilisateurs, documents privés, workflow et droits d'accès opérationnels.
6. Tableau de bord analytique et événements first-party essentiels opérationnels.
7. Notifications email essentielles opérationnelles ; SMS seulement lorsqu'un canal réel et autorisé existe.
8. Sauvegardes, procédures de restauration, monitoring et alertes documentés et vérifiés selon le scope disponible.
9. Paiements : architecture, facturation, preuve de paiement, rapprochement, audit et états client/admin fonctionnels. Les rails réels M-PESA/RAWBANK ne sont considérés live que lorsqu'un accès officiel ou un relais autorisé est disponible et validé.
10. CLEVONE Payment Gateway capable de relier utilisateur -> commande/service -> facture -> paiement -> preuve -> événement CLEVONE -> rapprochement -> validation -> activation idempotente -> reçu/facture acquittée -> audit.
11. Une preuve client seule ne peut jamais déclencher un paiement vérifié ; une source CLEVONE authentifiée ou officielle est nécessaire pour la validation automatique.
12. Les cas non concordants basculent en vérification humaine avec état explicite et délai indicatif jusqu'à 24 h.
13. Anti-doublon, idempotence, protection anti-rejeu, stockage privé des preuves et audit des décisions de paiement.
14. CI X200 fiable avec job principal `quality`, lanes METADATA/FAST/FULL et contrôles adaptés.
15. Les tests unitaires, intégration et E2E essentiels passent pour le scope concerné.
16. Aucun secret réel dans le dépôt ; aucun `.env` réel modifié automatiquement.
17. Documentation technique, sécurité, exploitation et déploiement suffisante pour reprendre le projet sans dépendance à une conversation.
18. Backlog cohérent : aucune tâche automatique nécessaire restante pour satisfaire ces critères.
19. Les seules actions restantes éventuelles sont des gates humaines explicites réellement sensibles, des dépendances externes indisponibles ou des évolutions futures hors objectif actuel.
20. Le marqueur `.x200/PRODUCT_COMPLETE.json` n'est valide que s'il correspond au HEAD courant, au hash courant de ce document et contient des preuves vérifiables.

## Règle de vérité

Distinguer strictement :

- conçu ;
- implémenté ;
- testé localement ;
- validé CI ;
- fusionné ;
- déployé ;
- activé réellement en production.

Une fonctionnalité ne doit jamais être déclarée live ou terminée au mauvais niveau.

## AutoPlan

Lorsque le backlog n'a plus de tâche automatique admissible, X200 AUTOPLAN doit :

1. auditer l'état réel ;
2. comparer avec ce document ;
3. détecter les écarts utiles ;
4. créer ou ajuster au maximum 3 tâches cohérentes sans doublon ;
5. valider le registre ;
6. laisser l'Autopilot les exécuter ;
7. répéter jusqu'à satisfaction réelle de l'objectif ou gate humain/externe légitime.

Aucune tâche de remplissage n'est autorisée pour maintenir artificiellement le mouvement.