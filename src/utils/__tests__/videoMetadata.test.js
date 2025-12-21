import { calculateScaledResolution, formatResolution, parseResolution } from '../videoMetadata'

describe('videoMetadata utilities', () => {
  describe('calculateScaledResolution', () => {
    it('should calculate half resolution correctly', () => {
      const result = calculateScaledResolution(1920, 1080, 0.5)
      expect(result).toEqual({ width: 960, height: 540 })
    })

    it('should calculate quarter resolution correctly', () => {
      const result = calculateScaledResolution(1920, 1080, 0.25)
      expect(result).toEqual({ width: 960, height: 540 })
    })

    it('should maintain aspect ratio', () => {
      const result = calculateScaledResolution(3840, 2160, 0.5)
      expect(result.width / result.height).toBeCloseTo(3840 / 2160, 2)
    })

    it('should handle 4K resolution', () => {
      const result = calculateScaledResolution(3840, 2160, 0.25)
      expect(result).toEqual({ width: 960, height: 540 })
    })
  })

  describe('formatResolution', () => {
    it('should format resolution as WIDTHxHEIGHT', () => {
      const result = formatResolution(1920, 1080)
      expect(result).toBe('1920x1080')
    })

    it('should handle 4K resolution', () => {
      const result = formatResolution(3840, 2160)
      expect(result).toBe('3840x2160')
    })
  })

  describe('parseResolution', () => {
    it('should parse resolution string correctly', () => {
      const result = parseResolution('1920x1080')
      expect(result).toEqual({ width: 1920, height: 1080 })
    })

    it('should handle 4K resolution', () => {
      const result = parseResolution('3840x2160')
      expect(result).toEqual({ width: 3840, height: 2160 })
    })

    it('should return null for invalid format', () => {
      const result = parseResolution('invalid')
      expect(result).toBeNull()
    })
  })
})

