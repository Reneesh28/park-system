/**
 * PARKWISE - Reusable Card Component
 * Phase 1.1: Project Initialization
 */

/**
 * Renders a standardized card HTML component.
 * @param {Object} props
 * @param {string} [props.title]
 * @param {string} props.content
 * @param {string} [props.footer]
 * @param {string} [props.className='']
 * @returns {string} HTML string
 */
export function renderCard({ title = '', content = '', footer = '', className = '' }) {
  const headerHtml = title ? `<div class="card-header">${title}</div>` : '';
  const footerHtml = footer ? `<div class="card-footer">${footer}</div>` : '';

  return `
    <div class="card ${className}">
      ${headerHtml}
      <div class="card-body">
        ${content}
      </div>
      ${footerHtml}
    </div>
  `;
}
