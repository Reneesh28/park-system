/**
 * PARKWISE - General Helper Utilities
 * Phase 1.1: Project Initialization
 */

/**
 * Safely query an element from the DOM with an optional scope.
 * @param {string} selector 
 * @param {Element|Document} [scope=document] 
 * @returns {Element|null}
 */
export function qs(selector, scope = document) {
  return scope.querySelector(selector);
}

/**
 * Safely query all elements from the DOM with an optional scope.
 * @param {string} selector 
 * @param {Element|Document} [scope=document] 
 * @returns {Element[]}
 */
export function qsa(selector, scope = document) {
  return Array.from(scope.querySelectorAll(selector));
}

/**
 * Debounce utility for input event handling.
 * @param {Function} fn 
 * @param {number} delayMs 
 * @returns {Function}
 */
export function debounce(fn, delayMs = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delayMs);
  };
}
