import { describe, it, expect } from 'vitest'
import { formatDate } from "@/types"

describe('utils', () => {
    it('formatDate formats dates correctly', () => {
        // Basic test to verify vitest is working
        const date = new Date('2023-01-01T12:00:00Z')
        // Note: This relies on local timezone, so output might vary. 
        // Ideally we mock the timezone or check for partial match.
        const result = formatDate(date.toISOString())
        expect(result).toContain('2023')
    })

    // it('formatDate handles invalid inputs gracefully', () => {
    //     expect(formatDate(null)).toBe('-')
    //     expect(formatDate(undefined)).toBe('-')
    // })
})
