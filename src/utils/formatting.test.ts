import { describe, it, expect } from 'vitest';
import { formatDuration, formatFileSize } from './formatting';

describe('formatDuration', () => {
  // Casos positivos
  it('should format 0 milliseconds as 00:00', () => {
    expect(formatDuration(0)).toBe('00:00');
  });

  it('should format seconds correctly (under 1 minute)', () => {
    expect(formatDuration(30000)).toBe('00:30');
  });

  it('should format 1 minute exactly', () => {
    expect(formatDuration(60000)).toBe('01:00');
  });

  it('should format minutes and seconds correctly', () => {
    expect(formatDuration(125000)).toBe('02:05');
  });

  it('should format 1 hour exactly', () => {
    expect(formatDuration(3600000)).toBe('1:00:00');
  });

  it('should format hours, minutes and seconds', () => {
    expect(formatDuration(3665000)).toBe('1:01:05');
  });

  it('should handle large durations (10+ hours)', () => {
    expect(formatDuration(36000000)).toBe('10:00:00');
  });

  // Casos negativos
  it('should handle negative numbers by treating as 0', () => {
    expect(formatDuration(-1000)).toBe('00:00');
  });

  it('should handle NaN by returning 00:00', () => {
    expect(formatDuration(NaN)).toBe('00:00');
  });

  it('should handle undefined by returning 00:00', () => {
    expect(formatDuration(undefined as any)).toBe('00:00');
  });

  it('should handle null by returning 00:00', () => {
    expect(formatDuration(null as any)).toBe('00:00');
  });

  it('should handle Infinity', () => {
    expect(formatDuration(Infinity)).toBe('00:00');
  });
});

describe('formatFileSize', () => {
  // Casos positivos
  it('should format 0 bytes', () => {
    expect(formatFileSize(0)).toBe('0 B');
  });

  it('should format bytes (< 1 KB)', () => {
    expect(formatFileSize(512)).toBe('512 B');
  });

  it('should format KB (1024 bytes)', () => {
    expect(formatFileSize(1024)).toBe('1.00 KB');
  });

  it('should format KB with decimals', () => {
    expect(formatFileSize(1536)).toBe('1.50 KB');
  });

  it('should format MB (1024 KB)', () => {
    expect(formatFileSize(1048576)).toBe('1.00 MB');
  });

  it('should format GB (1024 MB)', () => {
    expect(formatFileSize(1073741824)).toBe('1.00 GB');
  });

  it('should format large GB values', () => {
    expect(formatFileSize(5368709120)).toBe('5.00 GB');
  });

  // Casos negativos
  it('should handle negative sizes by treating as 0', () => {
    expect(formatFileSize(-1024)).toBe('0 B');
  });

  it('should handle NaN by returning 0 B', () => {
    expect(formatFileSize(NaN)).toBe('0 B');
  });

  it('should handle undefined', () => {
    expect(formatFileSize(undefined as any)).toBe('0 B');
  });

  it('should handle null', () => {
    expect(formatFileSize(null as any)).toBe('0 B');
  });
});
