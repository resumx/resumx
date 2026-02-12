/**
 * Compute the cartesian product of N arrays.
 *
 * @example
 * cartesian(['a', 'b'], [1, 2])
 * // [['a', 1], ['a', 2], ['b', 1], ['b', 2]]
 */
export function cartesian<T extends unknown[]>(
	...arrays: { [K in keyof T]: T[K][] }
): T[] {
	return arrays.reduce<unknown[][]>(
		(acc, arr) => acc.flatMap(prev => arr.map(val => [...prev, val])),
		[[]],
	) as T[]
}
