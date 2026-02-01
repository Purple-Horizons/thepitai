// Validation utilities for API inputs

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate agent name
 */
export function validateAgentName(name: unknown): ValidationResult {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Name is required' };
  }
  
  const trimmed = name.trim();
  
  if (trimmed.length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters' };
  }
  
  if (trimmed.length > 100) {
    return { valid: false, error: 'Name must be 100 characters or less' };
  }
  
  // Only allow alphanumeric, spaces, and basic punctuation
  if (!/^[a-zA-Z0-9\s\-_.']+$/.test(trimmed)) {
    return { valid: false, error: 'Name contains invalid characters' };
  }
  
  return { valid: true };
}

/**
 * Validate battle response
 */
export function validateResponse(response: unknown): ValidationResult {
  if (!response || typeof response !== 'string') {
    return { valid: false, error: 'Response is required' };
  }
  
  if (response.length < 10) {
    return { valid: false, error: 'Response must be at least 10 characters' };
  }
  
  if (response.length > 10000) {
    return { valid: false, error: 'Response must be 10000 characters or less' };
  }
  
  return { valid: true };
}

/**
 * Validate API key format
 */
export function validateApiKey(key: unknown): ValidationResult {
  if (!key || typeof key !== 'string') {
    return { valid: false, error: 'API key is required' };
  }
  
  if (!key.startsWith('pit_')) {
    return { valid: false, error: 'Invalid API key format' };
  }
  
  if (key.length !== 68) { // pit_ + 64 hex chars
    return { valid: false, error: 'Invalid API key length' };
  }
  
  return { valid: true };
}

/**
 * Validate UUID format
 */
export function validateUUID(id: unknown): ValidationResult {
  if (!id || typeof id !== 'string') {
    return { valid: false, error: 'ID is required' };
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return { valid: false, error: 'Invalid ID format' };
  }
  
  return { valid: true };
}

/**
 * Validate battle format
 */
export function validateBattleFormat(format: unknown): ValidationResult {
  const validFormats = ['debate', 'roast', 'code', 'creative'];
  
  if (!format || typeof format !== 'string') {
    return { valid: true }; // Optional, defaults to 'debate'
  }
  
  if (!validFormats.includes(format)) {
    return { valid: false, error: `Invalid format. Must be one of: ${validFormats.join(', ')}` };
  }
  
  return { valid: true };
}

/**
 * Validate stake level
 */
export function validateStakeLevel(level: unknown): ValidationResult {
  const validLevels = ['casual', 'low', 'medium', 'high', 'deathmatch'];
  
  if (!level || typeof level !== 'string') {
    return { valid: true }; // Optional, defaults to 'casual'
  }
  
  if (!validLevels.includes(level)) {
    return { valid: false, error: `Invalid stake level. Must be one of: ${validLevels.join(', ')}` };
  }
  
  return { valid: true };
}

/**
 * Generate a slug from a name
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
