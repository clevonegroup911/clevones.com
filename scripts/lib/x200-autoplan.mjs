import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

export function sha256Text(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function hashFileIfExists(filePath) {
  if (!existsSync(filePath)) return null;
  return sha256Text(readFileSync(filePath));
}

export function completionMarkerMatches(marker, { head, goalHash }) {
  return Boolean(
    marker
      && marker.version === 1
      && typeof marker.head === "string"
      && marker.head === head
      && typeof marker.goalHash === "string"
      && marker.goalHash === goalHash
      && Array.isArray(marker.evidence)
      && marker.evidence.length > 0
      && marker.evidence.every((item) => typeof item === "string" && item.trim().length > 0),
  );
}

function compactHumanTasks(tasks = []) {
  return tasks.map((task) => ({
    id: task.id,
    title: task.title,
    priority: task.priority,
    nextAction: task.nextAction || null,
  }));
}

export function buildAutoplanPrompt({ head, goalHash, humanReadyTasks = [] }) {
  const humanContext = compactHumanTasks(humanReadyTasks);
  return `MODE X200 AUTOPLAN — PLANIFICATION CONTINUE LOCALE SUR FEDORA.

Le backlog n'a actuellement aucune tâche automatique immédiatement exécutable. Cela NE signifie PAS que le produit est fini. Ton rôle dans ce cycle est uniquement d'auditer l'état réel du produit, de comparer cet état au but final et de créer le prochain travail utile sans doublon. N'implémente pas de fonctionnalité applicative pendant ce cycle de planification.

Lis obligatoirement : AGENTS.md, PRODUCT_GOAL.md, PROJECT_CONTEXT.md, backlog.json, BACKLOG.md, TASK_REPORT.md, .cursor/rules/clevones.mdc, package.json, les tests pertinents et l'état Git/PR/CI disponible. Inspecte aussi le code réel nécessaire pour vérifier les écarts. Ne te fie jamais à un simple texte disant qu'une chose est faite si le dépôt ou les preuves disent le contraire.

RÈGLES AUTOPLAN :
1. Zéro doublon : recherche d'abord une tâche existante couvrant le même objectif. Une tâche TERMINÉE avec preuve valide n'est jamais recréée.
2. Priorise les écarts qui rapprochent directement PRODUCT_GOAL.md du produit final utilisable.
3. Crée au maximum 3 nouvelles tâches cohérentes dans un cycle. Elles doivent être assez petites pour être exécutables, avec dépendances, scope, critères d'acceptation, tests, risque, coût, owner et requiresHuman exacts.
4. Utilise le prochain ID Txxx disponible sans dépasser T200. Respecte strictement le schéma de backlog.json.
5. Mets PRÊTE seulement une tâche dont les dépendances sont réellement satisfaites. Sinon utilise À_FAIRE. Ne contourne jamais une dépendance pour faire avancer artificiellement le flux.
6. requiresHuman=true uniquement pour une opération réellement sensible : production, migration réelle, secret/credential, permission/protection, auth/MFA production, transaction financière réelle, merge sensible, suppression/restauration ou opération irréversible.
7. Si une tâche humaine bloque un périmètre, cherche d'abord du travail indépendant réellement utile. Ne crée jamais de tâche de remplissage uniquement pour éviter le gate humain.
8. Mets à jour backlog.json de façon atomique, puis régénère BACKLOG.md avec npm run x200:backlog-md. Mets TASK_REPORT.md à jour uniquement si nécessaire pour refléter la planification.
9. Exécute npm run x200:validate et npm run x200:test avant de committer la planification. Corrige toute erreur de registre avant de terminer.
10. Commit et push uniquement sur la branche de travail actuelle autorisée. Jamais de push direct sur main. Ne touche ni .env ni secrets ni production.

FIN DU PRODUIT :
Si, et seulement si, tous les critères de PRODUCT_GOAL.md sont réellement satisfaits et vérifiables sur le HEAD courant, ne crée aucune tâche. Écris localement .x200/PRODUCT_COMPLETE.json avec exactement une structure de ce type :
{
  "version": 1,
  "head": "${head}",
  "goalHash": "${goalHash}",
  "generatedAt": "<ISO-8601>",
  "summary": "<résumé factuel>",
  "evidence": ["<preuve 1>", "<preuve 2>"]
}
La preuve doit être concrète : tests, CI, code, documentation opérationnelle et état externe requis. N'écris jamais ce marqueur si une exigence du but final reste non vérifiée.

Si les seuls écarts restants nécessitent une autorisation humaine, ne fabrique pas de travail automatique. Laisse le backlog cohérent et termine ce cycle ; le superviseur produira le HUMAN_GATE approprié.

HEAD courant : ${head}
Hash PRODUCT_GOAL.md : ${goalHash}
Tâches humaines PRÊTES actuellement : ${JSON.stringify(humanContext, null, 2)}

Résultat attendu de ce cycle : soit 1 à 3 tâches réellement utiles ajoutées/ajustées et validées, soit un marqueur PRODUCT_COMPLETE valide, soit aucun changement parce que seuls des gates humains restent.`;
}
