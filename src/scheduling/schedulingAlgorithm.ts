import type { LearningState, ReviewResult } from '../domain/enums'
import type { Memorization } from '../domain/models'

/** Result of scheduling one review. Spec section 35: the scheduling engine should be replaceable. */
export interface ScheduleUpdate {
  status: LearningState
  memoryStrength: number
  successStreakDays: string[]
  startedAt: number | null
  learnedAt: number | null
  lastReviewedAt: number
  nextReviewAt: number
  targetIntervalDays: number
  longestIntervalDays: number
}

/**
 * Pluggable scheduling engine (spec section 35/36 — "the scheduling engine should be
 * replaceable" and "multiple memory models [should be] evaluated"). Implementations
 * decide the next interval and learning-state transition from a single review result.
 */
export interface SchedulingAlgorithm {
  computeNext(memorization: Memorization, result: ReviewResult, nowMs: number): ScheduleUpdate
}
