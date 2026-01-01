# 🎨 Design System — 49GIG (Andela-Inspired)

**Status:** ✅ Complete  
**Date:** 2025-01-27

---

## 🎯 Design Philosophy

**Andela-Inspired Principles:**
- **Clean & Minimal**: Uncluttered interfaces with purposeful elements
- **Enterprise-Grade**: Professional, trustworthy, confident
- **Calm & Confident**: Soothing colors, generous spacing
- **Strong Typography**: Clear hierarchy, excellent readability
- **Minimal Noise**: Only essential visual elements
- **Purposeful Motion**: Smooth, meaningful animations

---

## 🔤 Typography

### **Font Families**

**Primary Font: Inter**
- Professional, modern sans-serif
- Excellent readability at all sizes
- Enterprise-grade appearance
- Weights: 300 (Light), 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)

**Heading Font: Inter Tight**
- Tighter letter spacing for headings
- More impactful, confident appearance
- Weights: 400, 500, 600, 700, 800

### **Type Scale**

```
xs:    12px  (0.75rem)   - Captions, labels
sm:    14px  (0.875rem)  - Small text
base:  16px  (1rem)      - Body text
lg:    18px  (1.125rem)  - Large body
xl:    20px  (1.25rem)   - Small headings
2xl:   24px  (1.5rem)    - Section headings
3xl:   30px  (1.875rem)  - Page headings
4xl:   36px  (2.25rem)   - Hero headings
5xl:   48px  (3rem)      - Large hero
6xl:   60px  (3.75rem)   - Display text
```

### **Line Heights**

- **Tight**: 1.25 - Headings
- **Snug**: 1.375 - Subheadings
- **Normal**: 1.5 - Body text
- **Relaxed**: 1.625 - Long-form content
- **Loose**: 2 - Spacious text

---

## 🎨 Color Palette

### **Primary Colors**

**Light Mode:**
- Primary: `oklch(45% 0.15 250)` - Deep, confident blue
- Primary Foreground: White

**Dark Mode:**
- Primary: `oklch(65% 0.15 250)` - Brighter blue for visibility
- Primary Foreground: Dark

### **Neutral Scale**

```
White:    oklch(100% 0 0)  - Pure white
Gray 50:  oklch(98% 0 0)   - Off-white
Gray 100: oklch(96% 0 0)   - Very light gray
Gray 200: oklch(92% 0 0)   - Light gray (borders)
Gray 300: oklch(85% 0 0)   - Medium-light gray
Gray 400: oklch(70% 0 0)   - Medium gray
Gray 500: oklch(55% 0 0)   - Base gray
Gray 600: oklch(40% 0 0)   - Medium-dark gray
Gray 700: oklch(30% 0 0)   - Dark gray
Gray 800: oklch(20% 0 0)   - Very dark gray
Gray 900: oklch(15% 0 0)   - Near black
Black:    oklch(0% 0 0)    - Pure black
```

### **Semantic Colors**

- **Success**: Green - `oklch(60% 0.15 150)`
- **Warning**: Yellow - `oklch(70% 0.2 50)`
- **Error**: Red - `oklch(55% 0.22 25)`
- **Info**: Blue - `oklch(65% 0.2 250)`

---

## 📏 Spacing System

**Base Unit: 8px** (generous, breathing room)

```
xs:   4px   (0.25rem)
sm:   8px   (0.5rem)
md:   16px  (1rem)
lg:   24px  (1.5rem)
xl:   32px  (2rem)
2xl:  48px  (3rem)
3xl:  64px  (4rem)
4xl:  96px  (6rem)
```

**Usage:**
- Use generous spacing for calm, professional feel
- Maintain consistent rhythm
- Group related elements with tighter spacing
- Separate sections with larger spacing

---

## 🔲 Border Radius

**Base: 8px** (subtle, professional)

```
sm:  4px
md:  6px
lg:  8px   (base)
xl:  12px
2xl: 16px
3xl: 20px
4xl: 24px
full: 9999px (pill)
```

---

## 🌑 Shadows

**Professional, Subtle Shadows**

```css
/* Soft - Cards, subtle elevation */
shadow-soft: 0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)

/* Medium - Modals, dropdowns */
shadow-medium: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)

/* Strong - Important modals, popovers */
shadow-strong: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)
```

---

## ✨ Animations (GSAP)

**Principles:**
- Smooth, purposeful motion
- Minimal, not distracting
- Performance-optimized
- Accessible (respects prefers-reduced-motion)

### **Animation Utilities**

```typescript
// Fade in
fadeIn(element, options)

// Fade in up
fadeInUp(element, options)

// Stagger fade in (for lists)
staggerFadeIn(elements, options)

// Scale in
scaleIn(element, options)

// Slide animations
slideInLeft(element, options)
slideInRight(element, options)

// Scroll-triggered
scrollReveal(element, options)
```

**Timing:**
- Fast: 150ms
- Normal: 200ms
- Slow: 300ms
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)`

---

## 🎭 Component Patterns

### **Buttons**

- Primary: Solid, confident
- Secondary: Outlined, subtle
- Ghost: Minimal, for less important actions
- Destructive: Red, for dangerous actions

### **Cards**

- Subtle shadow (soft)
- Generous padding
- Rounded corners (lg)
- Clean borders

### **Forms**

- Clear labels
- Helpful placeholders
- Accessible focus states
- Error states with clear messaging

---

## 📱 Responsive Design

**Breakpoints:**
```
sm:  640px   - Mobile landscape
md:  768px   - Tablet
lg:  1024px  - Desktop
xl:  1280px  - Large desktop
2xl: 1536px  - Extra large
```

**Approach:**
- Mobile-first
- Progressive enhancement
- Touch-friendly (min 44x44px targets)
- Readable text at all sizes

---

## ♿ Accessibility

- **WCAG 2.1 AA** compliance target
- Color contrast ratios meet standards
- Keyboard navigation support
- Screen reader friendly
- Focus indicators visible
- Respects `prefers-reduced-motion`

---

## 🎨 Theme Support

**Light Theme (Default)**
- Clean, bright, professional
- High contrast for readability
- Calm, confident appearance

**Dark Theme**
- Easy on the eyes
- Maintains contrast ratios
- Professional appearance

**System Theme**
- Respects user preference
- Auto-switches based on OS setting

---

## 📚 Usage Examples

### **Typography**

```tsx
<h1 className="font-heading text-5xl font-bold tracking-tight">
  Professional Heading
</h1>

<p className="text-base leading-relaxed text-muted-foreground">
  Body text with relaxed line height
</p>
```

### **Spacing**

```tsx
<div className="space-y-6"> {/* 24px spacing */}
  <Card className="p-6"> {/* 24px padding */}
    Content
  </Card>
</div>
```

### **Animations**

```tsx
import { fadeInUp } from "@/lib/animations";
import { useEffect, useRef } from "react";

function Component() {
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (ref.current) {
      fadeInUp(ref.current);
    }
  }, []);
  
  return <div ref={ref}>Content</div>;
}
```

---

## ✅ Design System Status

- ✅ Typography system (Inter + Inter Tight)
- ✅ Color palette (Andela-inspired)
- ✅ Spacing system (8px base)
- ✅ Border radius scale
- ✅ Shadow system
- ✅ GSAP animations
- ✅ Theme provider (light/dark/system)
- ✅ Design tokens
- ✅ Responsive breakpoints
- ✅ Accessibility considerations

---

**Status:** ✅ Design System Complete — Ready for Component Development


