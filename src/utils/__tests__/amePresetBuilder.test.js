import { buildPresetXML, getCodecClassID, getFileTypeID, escapeXml } from '../amePresetBuilder'

describe('amePresetBuilder utilities', () => {
  describe('getCodecClassID', () => {
    it('should return correct ClassID for MOV', () => {
      const result = getCodecClassID('MOV')
      expect(result).toBe('com.adobe.mediacore.video.codec.prores')
    })

    it('should return correct ClassID for MP4', () => {
      const result = getCodecClassID('MP4')
      expect(result).toBe('com.adobe.mediacore.video.codec.h264')
    })

    it('should return correct ClassID for HAP', () => {
      const result = getCodecClassID('HAP')
      expect(result).toBe('com.adobe.mediacore.video.codec.hap')
    })
  })

  describe('getFileTypeID', () => {
    it('should return correct file type ID for MOV', () => {
      const result = getFileTypeID('MOV')
      expect(result).toBe('com.adobe.mediacore.filetype.mov')
    })

    it('should return correct file type ID for MP4', () => {
      const result = getFileTypeID('MP4')
      expect(result).toBe('com.adobe.mediacore.filetype.mp4')
    })
  })

  describe('escapeXml', () => {
    it('should escape XML special characters', () => {
      const result = escapeXml('<test & "value">')
      expect(result).toBe('&lt;test &amp; &quot;value&quot;&gt;')
    })

    it('should handle apostrophes', () => {
      const result = escapeXml("it's")
      expect(result).toBe('it&apos;s')
    })

    it('should not escape normal text', () => {
      const result = escapeXml('normal text')
      expect(result).toBe('normal text')
    })
  })

  describe('buildPresetXML', () => {
    it('should build valid XML for MOV preset', () => {
      const config = {
        presetName: 'Test Preset',
        codec: 'MOV',
        quality: 4,
      }
      const result = buildPresetXML(config)
      expect(result).toContain('<?xml')
      expect(result).toContain('Test Preset')
      expect(result).toContain('com.adobe.mediacore.video.codec.prores')
    })

    it('should include quality settings', () => {
      const config = {
        presetName: 'Quality Test',
        codec: 'MP4',
        quality: 5,
      }
      const result = buildPresetXML(config)
      expect(result).toContain('Quality Test')
      expect(result).toContain('com.adobe.mediacore.video.codec.h264')
    })
  })
})

