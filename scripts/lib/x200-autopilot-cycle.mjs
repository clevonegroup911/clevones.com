import { completionMarkerMatches } from "./x200-autoplan.mjs";

/**
 * Decide the supervisor cycle before launching an agent.
 * Human gates block only their perimeter; independent auto work still wins.
 */
export function decideSupervisorAction({
  backlog,
  hasFastLanePrompt,
  head,
  goalHash,
  completionMarker,
}) {
  if (hasFastLanePrompt) {
    return { action: "FAST_LANE" };
  }

  if (goalHash && completionMarkerMatches(completionMarker, { head, goalHash })) {
    return { action: "AUTOPLAN_COMPLETE", head, goalHash };
  }

  const humanReady = (backlog?.tasks || []).filter(
    (task) => task.status === "PRÊTE" && task.requiresHuman,
  );

  return {
    action: "AUTOPLAN",
    reason: "NO_READY_AUTOMATIC_TASK",
    humanReadyCount: humanReady.length,
    humanReadyIds: humanReady.map((task) => task.id),
  };
}

/**
 * Interpret the backlog after an AUTOPLAN agent cycle.
 */
export function decideAfterAutoplan({
  backlogAfter,
  hasFastLanePrompt,
  head,
  goalHash,
  completionMarker,
}) {
  if (goalHash && completionMarkerMatches(completionMarker, { head, goalHash })) {
    return { action: "AUTOPLAN_COMPLETE", head, goalHash };
  }
  if (hasFastLanePrompt) {
    return { action: "AUTOPLAN_CREATED_WORK" };
  }

  const humanReady = (backlogAfter?.tasks || []).filter(
    (task) => task.status === "PRÊTE" && task.requiresHuman,
  );
  if (humanReady.length) {
    return {
      action: "HUMAN_GATE",
      reason: "OWNER_AUTHORIZATION_REQUIRED",
      tasks: humanReady,
    };
  }

  return { action: "AUTOPLAN_NO_USEFUL_WORK" };
}

/**
 * AUTOPLAN must never recreate a TERMINÉE task that still has valid evidence.
 */
export function wouldRecreateTerminatedTask(backlog, candidate) {
  if (!candidate || !candidate.id) return false;
  const existing = (backlog?.tasks || []).find((task) => task.id === candidate.id);
  if (!existing) return false;
  if (existing.status !== "TERMINÉE") return false;
  const evidence = Array.isArray(existing.evidence) ? existing.evidence : [];
  return evidence.some((item) => typeof item === "string" && item.trim().length > 0);
}
