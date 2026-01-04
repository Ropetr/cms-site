/**
 * HTML Sanitization Utilities
 * Removes potentially dangerous content from custom HTML blocks
 */

const DANGEROUS_TAGS = [
  'script',
  'iframe',
  'object',
  'embed',
  'form',
  'input',
  'button',
  'select',
  'textarea',
  'meta',
  'link',
  'base',
  'applet',
];

const DANGEROUS_ATTRIBUTES = [
  'onclick',
  'ondblclick',
  'onmousedown',
  'onmouseup',
  'onmouseover',
  'onmousemove',
  'onmouseout',
  'onmouseenter',
  'onmouseleave',
  'onkeydown',
  'onkeypress',
  'onkeyup',
  'onfocus',
  'onblur',
  'onchange',
  'onsubmit',
  'onreset',
  'onload',
  'onunload',
  'onerror',
  'onabort',
  'onscroll',
  'onresize',
  'ondrag',
  'ondrop',
  'onpaste',
  'oncopy',
  'oncut',
  'oncontextmenu',
  'formaction',
  'xlink:href',
  'data-',
];

const DANGEROUS_PROTOCOLS = [
  'javascript:',
  'vbscript:',
  'data:text/html',
  'data:application',
];

/**
 * Remove unterminated dangerous tags (tags without closing >)
 * This handles cases like <script without > that could bypass other filters
 */
const removeUnterminatedTags = (html: string): string => {
  let result = html;
  
  for (const tag of DANGEROUS_TAGS) {
    const unterminatedRegex = new RegExp(`<${tag}(?:\\s[^>]*)?$`, 'gi');
    result = result.replace(unterminatedRegex, '');
    
    const unterminatedMidRegex = new RegExp(`<${tag}(?:\\s[^>]*)?(?=<)`, 'gi');
    result = result.replace(unterminatedMidRegex, '');
  }
  
  return result;
};

/**
 * Remove dangerous tags from HTML
 * Uses iterative approach to handle nested/malformed tags
 */
const removeDangerousTags = (html: string): string => {
  let result = html;
  let previousResult = '';
  
  while (result !== previousResult) {
    previousResult = result;
    
    for (const tag of DANGEROUS_TAGS) {
      const openTagRegex = new RegExp(`<${tag}\\s*[^>]*>`, 'gi');
      const closeTagRegex = new RegExp(`<\\s*/\\s*${tag}\\s*>`, 'gi');
      const selfClosingRegex = new RegExp(`<${tag}\\s*[^>]*/\\s*>`, 'gi');
      
      result = result.replace(openTagRegex, '');
      result = result.replace(closeTagRegex, '');
      result = result.replace(selfClosingRegex, '');
    }
    
    const scriptContentRegex = /<script\b[^<]*(?:(?!<\s*\/\s*script\s*>)<[^<]*)*<\s*\/\s*script\s*>/gi;
    result = result.replace(scriptContentRegex, '');
  }
  
  result = removeUnterminatedTags(result);
  
  return result;
};

/**
 * Remove dangerous attributes from HTML
 */
const removeDangerousAttributes = (html: string): string => {
  let result = html;
  
  for (const attr of DANGEROUS_ATTRIBUTES) {
    if (attr.endsWith('-')) {
      const attrRegex = new RegExp(`\\s${attr}[a-z-]*\\s*=\\s*["'][^"']*["']`, 'gi');
      result = result.replace(attrRegex, '');
    } else {
      const attrRegex = new RegExp(`\\s${attr}\\s*=\\s*["'][^"']*["']`, 'gi');
      result = result.replace(attrRegex, '');
    }
  }
  
  return result;
};

/**
 * Remove dangerous protocols from href/src attributes
 */
const removeDangerousProtocols = (html: string): string => {
  let result = html;
  
  for (const protocol of DANGEROUS_PROTOCOLS) {
    const hrefRegex = new RegExp(`href\\s*=\\s*["']${protocol}[^"']*["']`, 'gi');
    const srcRegex = new RegExp(`src\\s*=\\s*["']${protocol}[^"']*["']`, 'gi');
    
    result = result.replace(hrefRegex, 'href="#"');
    result = result.replace(srcRegex, 'src=""');
  }
  
  return result;
};

/**
 * Remove HTML comments (can contain IE conditional comments with scripts)
 * Uses iterative approach to handle nested comments
 * Also removes unterminated comments (<!-- without -->)
 */
const removeComments = (html: string): string => {
  let result = html;
  let previousResult = '';
  
  while (result !== previousResult) {
    previousResult = result;
    result = result.replace(/<!--[\s\S]*?-->/g, '');
  }
  
  result = result.replace(/<!--[\s\S]*$/g, '');
  result = result.replace(/<!--(?![\s\S]*-->)[\s\S]*/g, '');
  
  return result;
};

/**
 * Final safety check - if any dangerous patterns remain after sanitization,
 * escape the entire content to prevent XSS
 */
const containsDangerousPatterns = (html: string): boolean => {
  const lowerHtml = html.toLowerCase();
  
  for (const tag of DANGEROUS_TAGS) {
    if (new RegExp(`<\\s*${tag}\\b`, 'i').test(html)) {
      return true;
    }
  }
  
  if (/<!--/.test(html)) {
    return true;
  }
  
  if (/javascript\s*:/i.test(html) || /vbscript\s*:/i.test(html)) {
    return true;
  }
  
  if (/\bon\w+\s*=/i.test(html)) {
    return true;
  }
  
  return false;
};

/**
 * Sanitize custom HTML content
 * Removes scripts, dangerous attributes, and potentially harmful content
 * Uses a "kill switch" approach: if dangerous patterns remain after sanitization,
 * the entire content is escaped to prevent XSS
 */
export const sanitizeHtml = (html: string): string => {
  if (!html || typeof html !== 'string') {
    return '';
  }
  
  let result = html;
  
  result = removeComments(result);
  result = removeDangerousTags(result);
  result = removeDangerousAttributes(result);
  result = removeDangerousProtocols(result);
  
  result = result.trim();
  
  if (containsDangerousPatterns(result)) {
    return escapeHtml(result);
  }
  
  return result;
};

/**
 * Check if HTML contains potentially dangerous content
 * Returns list of warnings
 */
export const checkHtmlSecurity = (html: string): string[] => {
  const warnings: string[] = [];
  
  if (!html || typeof html !== 'string') {
    return warnings;
  }
  
  for (const tag of DANGEROUS_TAGS) {
    const regex = new RegExp(`<${tag}[\\s>]`, 'gi');
    if (regex.test(html)) {
      warnings.push(`Tag <${tag}> detectada e será removida`);
    }
  }
  
  for (const attr of DANGEROUS_ATTRIBUTES) {
    if (attr.endsWith('-')) {
      const regex = new RegExp(`\\s${attr}[a-z-]*\\s*=`, 'gi');
      if (regex.test(html)) {
        warnings.push(`Atributo ${attr}* detectado e será removido`);
      }
    } else {
      const regex = new RegExp(`\\s${attr}\\s*=`, 'gi');
      if (regex.test(html)) {
        warnings.push(`Atributo ${attr} detectado e será removido`);
      }
    }
  }
  
  for (const protocol of DANGEROUS_PROTOCOLS) {
    if (html.toLowerCase().includes(protocol)) {
      warnings.push(`Protocolo ${protocol} detectado e será removido`);
    }
  }
  
  return warnings;
};

/**
 * Sanitize content object (for page sections)
 * Specifically handles custom_html blocks
 */
export const sanitizeBlockContent = (content: any, blockType: string): any => {
  if (!content) return content;
  
  if (blockType === 'custom_html' && content.html) {
    return {
      ...content,
      html: sanitizeHtml(content.html),
    };
  }
  
  return content;
};

/**
 * Escape HTML entities for safe display
 */
export const escapeHtml = (text: string): string => {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
};
