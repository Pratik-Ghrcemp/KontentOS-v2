/**
 * Structural Template Engine
 * Generates calibrated multi-track text and overlay layouts dynamically
 * scaled to the composition's total duration.
 */

import { TimelineItem } from './types';

export interface StructuralTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  badge: string;
  generateItems: (totalDuration: number, startTime?: number) => TimelineItem[];
}

export const STRUCTURAL_TEMPLATES: Record<string, StructuralTemplate> = {
  viral_hook_cta: {
    id: 'viral_hook_cta',
    name: 'Viral Hook-Body-CTA',
    category: 'High Retention',
    badge: '3-Phase Hook',
    description: 'Calibrated 3-part layout: Bold opening hook, core insight body, and final CTA.',
    generateItems: (totalDuration: number, startTime: number = 0) => {
      const dur = Math.max(4, totalDuration > 0 ? totalDuration : 15);
      const hookEnd = Math.min(3.0, dur * 0.3);
      const ctaStart = Math.max(hookEnd + 1.0, dur - 3.0);

      return [
        {
          id: `tmpl-hook-${crypto.randomUUID()}`,
          trackId: 'track-text-1',
          type: 'text',
          start: startTime,
          end: startTime + hookEnd,
          label: '🔥 Bold Hook Title',
          content: 'WAIT FOR THE END... 😱',
          properties: {
            x: 0,
            y: -140,
            fontSize: 44,
            color: '#facc15',
            fontFamily: 'Inter',
            backgroundColor: '#000000',
            backgroundOpacity: 0.85,
            boxPadding: 12,
            scale: 100,
            opacity: 100,
            rotation: 0,
            zIndex: 25
          }
        },
        {
          id: `tmpl-body-${crypto.randomUUID()}`,
          trackId: 'track-text-1',
          type: 'text',
          start: startTime + hookEnd,
          end: startTime + ctaStart,
          label: '💡 Key Insight Lower-Third',
          content: 'Here is what nobody tells you about this:',
          properties: {
            x: 0,
            y: 140,
            fontSize: 28,
            color: '#ffffff',
            fontFamily: 'Inter',
            backgroundColor: '#000000',
            backgroundOpacity: 0.75,
            boxPadding: 10,
            scale: 100,
            opacity: 100,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          id: `tmpl-cta-${crypto.randomUUID()}`,
          trackId: 'track-text-1',
          type: 'text',
          start: startTime + ctaStart,
          end: startTime + dur,
          label: '👉 Final Call to Action',
          content: '👉 FOLLOW FOR PART 2!',
          properties: {
            x: 0,
            y: 0,
            fontSize: 38,
            color: '#06b6d4',
            fontFamily: 'Inter',
            backgroundColor: '#000000',
            backgroundOpacity: 0.9,
            boxPadding: 14,
            scale: 100,
            opacity: 100,
            rotation: 0,
            zIndex: 30
          }
        }
      ];
    }
  },

  educational_breakdown: {
    id: 'educational_breakdown',
    name: 'Educational Breakdown',
    category: 'Tutorial',
    badge: '3-Step Framework',
    description: 'Sequential 3-step banner layout optimized for tutorials and explainers.',
    generateItems: (totalDuration: number, startTime: number = 0) => {
      const dur = Math.max(6, totalDuration > 0 ? totalDuration : 15);
      const step1End = dur * 0.33;
      const step2End = dur * 0.66;

      return [
        {
          id: `tmpl-step1-${crypto.randomUUID()}`,
          trackId: 'track-text-1',
          type: 'text',
          start: startTime,
          end: startTime + step1End,
          label: '📌 STEP 1: The Foundation',
          content: '📌 STEP 1: Set Up The Core Foundation',
          properties: {
            x: 0,
            y: -130,
            fontSize: 34,
            color: '#38bdf8',
            fontFamily: 'Inter',
            backgroundColor: '#0f172a',
            backgroundOpacity: 0.9,
            boxPadding: 10,
            scale: 100,
            opacity: 100,
            rotation: 0,
            zIndex: 25
          }
        },
        {
          id: `tmpl-step2-${crypto.randomUUID()}`,
          trackId: 'track-text-1',
          type: 'text',
          start: startTime + step1End,
          end: startTime + step2End,
          label: '⚡ STEP 2: The Core Action',
          content: '⚡ STEP 2: Execute With Consistency',
          properties: {
            x: 0,
            y: -130,
            fontSize: 34,
            color: '#fbbf24',
            fontFamily: 'Inter',
            backgroundColor: '#0f172a',
            backgroundOpacity: 0.9,
            boxPadding: 10,
            scale: 100,
            opacity: 100,
            rotation: 0,
            zIndex: 25
          }
        },
        {
          id: `tmpl-step3-${crypto.randomUUID()}`,
          trackId: 'track-text-1',
          type: 'text',
          start: startTime + step2End,
          end: startTime + dur,
          label: '🎯 STEP 3: The Result',
          content: '🎯 STEP 3: Scale Your Success',
          properties: {
            x: 0,
            y: -130,
            fontSize: 34,
            color: '#34d399',
            fontFamily: 'Inter',
            backgroundColor: '#0f172a',
            backgroundOpacity: 0.9,
            boxPadding: 10,
            scale: 100,
            opacity: 100,
            rotation: 0,
            zIndex: 25
          }
        }
      ];
    }
  },

  product_showcase: {
    id: 'product_showcase',
    name: 'Product Showcase / Demo',
    category: 'E-Commerce / SaaS',
    badge: 'Feature Highlights',
    description: 'Highlight features with a persistent top pill, callout, and bottom offer box.',
    generateItems: (totalDuration: number, startTime: number = 0) => {
      const dur = Math.max(5, totalDuration > 0 ? totalDuration : 15);
      const calloutStart = Math.min(1.5, dur * 0.2);
      const calloutEnd = Math.min(dur - 2.0, calloutStart + 4.0);
      const ctaStart = Math.max(calloutEnd, dur - 3.5);

      return [
        {
          id: `tmpl-prod-header-${crypto.randomUUID()}`,
          trackId: 'track-text-1',
          type: 'text',
          start: startTime,
          end: startTime + dur,
          label: '✨ Persistent Header Pill',
          content: '✨ FEATURE SPOTLIGHT',
          properties: {
            x: 0,
            y: -180,
            fontSize: 24,
            color: '#f43f5e',
            fontFamily: 'Inter',
            backgroundColor: '#ffffff',
            backgroundOpacity: 0.95,
            boxPadding: 8,
            scale: 100,
            opacity: 100,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          id: `tmpl-prod-callout-${crypto.randomUUID()}`,
          trackId: 'track-text-1',
          type: 'text',
          start: startTime + calloutStart,
          end: startTime + calloutEnd,
          label: '🔥 10x Performance Boost',
          content: '🔥 10x Faster Workflow in Seconds',
          properties: {
            x: 0,
            y: -40,
            fontSize: 32,
            color: '#ffffff',
            fontFamily: 'Inter',
            backgroundColor: '#000000',
            backgroundOpacity: 0.85,
            boxPadding: 10,
            scale: 100,
            opacity: 100,
            rotation: 0,
            zIndex: 25
          }
        },
        {
          id: `tmpl-prod-cta-${crypto.randomUUID()}`,
          trackId: 'track-text-1',
          type: 'text',
          start: startTime + ctaStart,
          end: startTime + dur,
          label: '🛒 Link in Bio • Special Offer',
          content: '🛒 Link in Bio • 20% OFF TODAY',
          properties: {
            x: 0,
            y: 130,
            fontSize: 32,
            color: '#facc15',
            fontFamily: 'Inter',
            backgroundColor: '#000000',
            backgroundOpacity: 0.9,
            boxPadding: 12,
            scale: 100,
            opacity: 100,
            rotation: 0,
            zIndex: 30
          }
        }
      ];
    }
  },

  myth_buster: {
    id: 'myth_buster',
    name: 'Quick Tips / Myth Buster',
    category: 'High Engagement',
    badge: 'Myth vs Reality',
    description: 'Fast-paced myth vs reality contrast designed for viral social shorts.',
    generateItems: (totalDuration: number, startTime: number = 0) => {
      const dur = Math.max(4, totalDuration > 0 ? totalDuration : 15);
      const splitTime = dur * 0.5;

      return [
        {
          id: `tmpl-myth-${crypto.randomUUID()}`,
          trackId: 'track-text-1',
          type: 'text',
          start: startTime,
          end: startTime + splitTime,
          label: '❌ Myth Statement',
          content: '❌ MYTH: Hard Work Alone Guarantees Success',
          properties: {
            x: 0,
            y: -40,
            fontSize: 34,
            color: '#f43f5e',
            fontFamily: 'Inter',
            backgroundColor: '#000000',
            backgroundOpacity: 0.9,
            boxPadding: 12,
            scale: 100,
            opacity: 100,
            rotation: 0,
            zIndex: 25
          }
        },
        {
          id: `tmpl-reality-${crypto.randomUUID()}`,
          trackId: 'track-text-1',
          type: 'text',
          start: startTime + splitTime,
          end: startTime + dur,
          label: '✅ Reality Statement',
          content: '✅ REALITY: Smart Systems & Leverage Win Every Time',
          properties: {
            x: 0,
            y: -40,
            fontSize: 34,
            color: '#10b981',
            fontFamily: 'Inter',
            backgroundColor: '#000000',
            backgroundOpacity: 0.9,
            boxPadding: 12,
            scale: 100,
            opacity: 100,
            rotation: 0,
            zIndex: 25
          }
        }
      ];
    }
  }
};

export interface CustomTemplate {
  id: string;
  name: string;
  createdAt: number;
  badge: string;
  description: string;
  items: TimelineItem[];
}

const CUSTOM_TEMPLATE_STORAGE_KEY = 'kontentos_custom_templates';

export function saveCustomTemplate(name: string, items: TimelineItem[]): CustomTemplate {
  const customTmpl: CustomTemplate = {
    id: `custom-tmpl-${crypto.randomUUID()}`,
    name: name.trim() || 'My Custom Template',
    createdAt: Date.now(),
    badge: 'Custom',
    description: `Saved template with ${items.length} layers`,
    items: JSON.parse(JSON.stringify(items))
  };

  if (typeof window !== 'undefined') {
    try {
      const existing: CustomTemplate[] = getCustomTemplates();
      const updated = [customTmpl, ...existing.filter(t => t.name !== customTmpl.name)];
      localStorage.setItem(CUSTOM_TEMPLATE_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not save custom template to localStorage', e);
    }
  }

  return customTmpl;
}

export function getCustomTemplates(): CustomTemplate[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOM_TEMPLATE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function deleteCustomTemplate(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getCustomTemplates();
    const updated = existing.filter(t => t.id !== id);
    localStorage.setItem(CUSTOM_TEMPLATE_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Could not delete custom template from localStorage', e);
  }
}
