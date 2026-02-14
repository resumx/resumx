/**
 * Weighted proportional solver.
 *
 * Think of t as a single "shrink knob" from 0 to 1:
 *   t = 0  →  everything at full size (no shrinking)
 *   t = 1  →  everything at its smallest allowed size
 *
 * Each variable has a power exponent that controls its shrink curve:
 *   power 0.5 (spacing)    → shrinks fast early
 *   power 1.0 (margins)    → linear
 *   power 2.0 (typography) → resists change until t is high
 *
 * The solver binary-searches for the smallest turn of the knob
 * where the content still fits.
 */

import type { VariableRange } from './types.js'

// ── Problem definition ─────────────────────────────────────────────────────

export interface FitProblem {
	/** Variables with their allowed ranges. */
	variables: VariableRange[]
	/** Returns true when the candidate values satisfy the constraint. */
	fits: (values: Record<string, number>) => boolean
}

export interface FitSolution {
	/** How far the knob was turned (0 = no shrinking, 1 = maximum shrinking). */
	t: number
	/** The resulting value for each variable at the optimal t. */
	values: Record<string, number>
}

// ── Solver ─────────────────────────────────────────────────────────────────

/** Number of binary search iterations (~6 decimal places of precision). */
const ITERATIONS = 20

/**
 * Find the least amount of shrinking needed to satisfy the constraint.
 *
 * Binary-searches t ∈ [0, 1] and returns the smallest t where `fits`
 * returns true. Each variable shrinks at a rate controlled by its
 * power exponent: spacing first, margins second, font size last.
 */
export function solve(problem: FitProblem): FitSolution {
	const { variables, fits } = problem

	let lo = 0
	let hi = 1
	for (let i = 0; i < ITERATIONS; i++) {
		const mid = (lo + hi) / 2
		if (fits(interpolate(variables, mid))) hi = mid
		else lo = mid
	}

	return { t: hi, values: interpolate(variables, hi) }
}

/**
 * Compute each variable's value at a given knob position t.
 *
 * Applies a per-variable power curve before interpolating:
 *   effective_t = t ^ power
 *   value = original − effective_t × (original − minimum)
 *
 * At t = 0.5 with default powers:
 *   spacing (0.5):    0.5^0.5 = 0.71 → 71% toward minimum
 *   margins (1.0):    0.5^1.0 = 0.50 → 50% toward minimum
 *   typography (2.0): 0.5^2.0 = 0.25 → 25% toward minimum
 */
export function interpolate(
	variables: VariableRange[],
	t: number,
): Record<string, number> {
	const result: Record<string, number> = {}
	for (const v of variables) {
		const effectiveT = Math.pow(t, v.power ?? 1)
		result[v.key] = v.original - effectiveT * (v.original - v.minimum)
	}
	return result
}
