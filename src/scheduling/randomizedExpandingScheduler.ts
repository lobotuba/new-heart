import { LearningState, ReviewResult } from '../domain/enums'
import type { Memorization } from '../domain/models'
import type { ScheduleUpdate, SchedulingAlgorithm } from './schedulingAlgorithm'

const DAY_MS = 24 * 60 * 60 * 1000
const EXPANDING_STEPS_DAYS = [1, 3, 7, 14, 30, 60, 90, 180, 365]
const JITTER_FRACTION = 0.175
const LEARNED_STREAK_REQUIRED = 3

function todayISO(nowMs: number): string {
  const d = new Date(nowMs)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function nextExpandingTarget(currentTarget: number): number {
  return EXPANDING_STEPS_DAYS.find((step) => step > currentTarget) ?? EXPANDING_STEPS_DAYS[EXPANDING_STEPS_DAYS.length - 1]
}

/** Bounded randomness (spec section 3): target ± ~15-20%, never a fixed cadence. */
function jitteredDays(target: number): number {
  if (target <= 1) return 1
  const jitterRange = Math.max(1, Math.floor(target * JITTER_FRACTION))
  const delta = Math.floor(Math.random() * (2 * jitterRange + 1)) - jitterRange
  return Math.max(1, target + delta)
}

/**
 * Default scheduler: expanding target intervals (spec section 35/36) jittered by a
 * bounded random fraction of the target (spec section 3 — target ± 15-20%, never a
 * fixed cadence like "1, 7, 14, 30").
 *
 * A verse becomes Learned (spec section 8) after three "I Know It" results landing on
 * three separate calendar days, then moves straight into the Retention queue — Learned
 * is a momentary milestone (recorded via `learnedAt`), not a queue of its own (spec
 * section 6's three-queue diagram: New / Relearn / Retention).
 */
export class RandomizedExpandingScheduler implements SchedulingAlgorithm {
  computeNext(memorization: Memorization, result: ReviewResult, nowMs: number): ScheduleUpdate {
    switch (result) {
      case ReviewResult.KnowIt:
        return this.onKnowIt(memorization, nowMs)
      case ReviewResult.NeededHelp:
        return this.onNeededHelp(memorization, nowMs)
      case ReviewResult.Relearn:
        return this.onRelearn(memorization, nowMs)
    }
  }

  private onKnowIt(m: Memorization, nowMs: number): ScheduleUpdate {
    const today = todayISO(nowMs)
    const newStreak = m.successStreakDays.includes(today) ? m.successStreakDays : [...m.successStreakDays, today]
    const alreadyLearnedBefore = m.learnedAt != null
    const reachesLearnedThreshold = !alreadyLearnedBefore && newStreak.length >= LEARNED_STREAK_REQUIRED

    const newStatus = reachesLearnedThreshold
      ? LearningState.Retention
      : m.status === LearningState.Relearning
        ? LearningState.Retention
        : m.status === LearningState.Scheduled
          ? LearningState.Learning
          : m.status

    const jittered = jitteredDays(nextExpandingTarget(m.targetIntervalDays))

    return {
      status: newStatus,
      memoryStrength: Math.min(100, m.memoryStrength + 15),
      successStreakDays: newStreak,
      startedAt: m.startedAt ?? nowMs,
      learnedAt: reachesLearnedThreshold ? nowMs : m.learnedAt,
      lastReviewedAt: nowMs,
      nextReviewAt: nowMs + jittered * DAY_MS,
      targetIntervalDays: jittered,
      longestIntervalDays: Math.max(m.longestIntervalDays, jittered),
    }
  }

  /** "Not a failure" (spec section 10) — shortens the interval but never demotes to Relearn. */
  private onNeededHelp(m: Memorization, nowMs: number): ScheduleUpdate {
    const jittered = jitteredDays(Math.max(1, Math.floor(m.targetIntervalDays / 3)))

    return {
      status: m.status === LearningState.Scheduled ? LearningState.Learning : m.status,
      memoryStrength: Math.max(0, m.memoryStrength - 5),
      successStreakDays: m.successStreakDays,
      startedAt: m.startedAt ?? nowMs,
      learnedAt: m.learnedAt,
      lastReviewedAt: nowMs,
      nextReviewAt: nowMs + jittered * DAY_MS,
      targetIntervalDays: jittered,
      longestIntervalDays: m.longestIntervalDays,
    }
  }

  /**
   * "The verse is not treated like a brand-new verse" (spec section 13) — the relearn
   * interval is scaled from the verse's own longest-ever interval rather than
   * restarting the expanding sequence at day one.
   */
  private onRelearn(m: Memorization, nowMs: number): ScheduleUpdate {
    const relearnBase = m.longestIntervalDays > 0 ? Math.min(14, Math.max(1, Math.floor(m.longestIntervalDays / 4))) : 1
    const jittered = jitteredDays(relearnBase)

    return {
      status: LearningState.Relearning,
      memoryStrength: Math.max(5, m.memoryStrength - 25),
      successStreakDays: m.learnedAt == null ? [] : m.successStreakDays,
      startedAt: m.startedAt ?? nowMs,
      learnedAt: m.learnedAt,
      lastReviewedAt: nowMs,
      nextReviewAt: nowMs + jittered * DAY_MS,
      targetIntervalDays: jittered,
      longestIntervalDays: m.longestIntervalDays,
    }
  }
}
