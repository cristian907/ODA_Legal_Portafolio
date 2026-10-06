import { describe, expect, it } from 'vitest'
import { reorder } from './galleryList'

describe('reorder', () => {
  const list = ['a', 'b', 'c', 'd']

  it('moves an item forward', () => {
    expect(reorder(list, 0, 2)).toEqual(['b', 'c', 'a', 'd'])
  })

  it('moves an item backward', () => {
    expect(reorder(list, 3, 1)).toEqual(['a', 'd', 'b', 'c'])
  })

  it('does not mutate the original list', () => {
    reorder(list, 0, 3)
    expect(list).toEqual(['a', 'b', 'c', 'd'])
  })

  it('clamps the target index to the list bounds', () => {
    expect(reorder(list, 1, 99)).toEqual(['a', 'c', 'd', 'b'])
    expect(reorder(list, 2, -5)).toEqual(['c', 'a', 'b', 'd'])
  })

  it('returns an unchanged copy for an unknown source index', () => {
    const result = reorder(list, 7, 0)
    expect(result).toEqual(list)
    expect(result).not.toBe(list)
  })
})
