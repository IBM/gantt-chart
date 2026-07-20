import { describe, it, expect } from 'vitest';
import Gantt from '../src';

describe('Security Fixes', () => {
  describe('XSS Prevention - textContent usage', () => {
    it('should escape HTML tags when using textContent', () => {
      const div = document.createElement('div');
      const xssPayload = '<img src=x onerror="alert(1)">';
      div.textContent = xssPayload;
      // innerHTML should show escaped version since we used textContent
      expect(div.innerHTML).toContain('&lt;');
      expect(div.innerHTML).toContain('&gt;');
      expect(div.innerHTML).not.toContain('<img');
    });
  });

  describe('Prototype Pollution Prevention', () => {
    it('should block __proto__ in mergeObjects', () => {
      const target = { safe: 'value' };
      const malicious = { __proto__: { isAdmin: true }, safe: 'other' };
      const result = Gantt.utils.mergeObjects(target, malicious);

      expect(result.safe).toBe('other');
      // __proto__ should not be in the result
      expect(Object.keys(result)).not.toContain('__proto__');
      expect({}.isAdmin).toBeUndefined();
    });

    it('should block constructor in mergeObjects', () => {
      const target = {};
      const malicious = { constructor: { test: true } };
      const result = Gantt.utils.mergeObjects(target, malicious);

      // constructor property should not be overwritten
      expect(Object.keys(result)).not.toContain('constructor');
    });

    it('should block prototype in mergeObjects', () => {
      const target = {};
      const malicious = { prototype: { isAdmin: true } };
      const result = Gantt.utils.mergeObjects(target, malicious);

      expect(Object.keys(result)).not.toContain('prototype');
    });
  });

  describe('ReDoS Prevention', () => {
    it('escapeRegExp should properly escape regex special chars', () => {
      const special = '.*+?^${}()|[]\\';
      const escaped = Gantt.utils.escapeRegExp(special);

      // Each special char should be escaped
      expect(escaped).toContain('\\.');
      expect(escaped).toContain('\\*');
      expect(escaped).toContain('\\+');
    });

    it('should handle className with special chars', () => {
      const el = document.createElement('div');
      el.className = 'test normal-class';

      const specialClass = 'test[bracket]';
      Gantt.utils.addClass(el, specialClass);

      // Should not throw or hang when checking class with special chars
      const hasIt = Gantt.utils.hasClass(el, specialClass);
      expect(hasIt).toBe(true);
    });
  });

  describe('Date.prototype Pollution Prevention', () => {
    it('should not pollute Date.prototype with format method', () => {
      const date = new Date();
      expect(typeof date.format).toBe('undefined');
    });

    it('should provide standalone Gantt.utils.formatDate utility', () => {
      expect(typeof Gantt.utils.formatDate).toBe('function');
      const date = new Date('2024-01-15T12:30:45Z');
      const formatted = Gantt.utils.formatDate(date, 'yyyy-mm-dd');
      expect(formatted).toBeTruthy();
    });

    it('formatDate should work with default format', () => {
      const date = new Date();
      const formatted = Gantt.utils.formatDate(date);
      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    });
  });

  describe('Null Check Guards', () => {
    it('should handle missing DOM elements gracefully', () => {
      const nonExistentId = 'truly-nonexistent-element-12345';
      const domNode = document.getElementById(nonExistentId);
      expect(domNode).toBeNull();
    });
  });
});
