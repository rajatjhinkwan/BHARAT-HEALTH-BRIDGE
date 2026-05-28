/**
 * Securely escapes special characters in a string so it can be safely used in a RegExp constructor.
 * Prevents RegExp Injection and ReDoS vulnerabilities.
 * 
 * @param {string} string - The raw string to escape.
 * @returns {string} - The safely escaped string.
 */
export function escapeRegExp(string) {
  if (typeof string !== 'string') return '';
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
