# Design System Standards - Premium Hotel Site

## 🎨 Established Design Tokens

These tokens ensure consistency across all pages and future components.

---

## 📐 Spacing System

### Padding Standards
```
Section padding:        py-32        (128px top/bottom)
Content padding:        px-4         (16px left/right in container)
Container max-width:    max-w-7xl    (80rem)
```

### Margin Standards
```
Large gap:              mb-16        (64px - between major sections)
Medium gap:             mb-12        (48px - between content blocks)
Small gap:              mb-8         (32px - between minor elements)
Component margin:       mb-4         (16px - within components)
```

### Gap/Spacing Between Items
```
Large gaps:             gap-10       (40px - room cards, main items)
Medium gaps:            gap-6, gap-8 (24px/32px - flex items)
Small gaps:             gap-4, gap-3 (16px/12px - badges, inline items)
```

---

## 🔤 Typography System

### Heading Hierarchy

#### H1 - Hero Main Heading
```
text-5xl md:text-7xl lg:text-8xl font-display font-light
Line-height: leading-tight
Letter-spacing: tracking-tight
Drop shadow: drop-shadow-2xl
```

#### H2 - Section Headings
```
text-4xl md:text-5xl lg:text-6xl font-display font-light
```

#### H3 - Card Headings
```
text-xl md:text-2xl font-display font-light
```

#### H4 - Experience/Item Titles
```
text-lg md:text-xl font-display font-light
```

### Body Text

#### Lead/Description Text
```
text-base md:text-lg text-slate-600 font-light
Line-height: leading-relaxed
```

#### Small Text/Captions
```
text-sm font-light text-slate-600
```

#### Labels/Tags
```
text-xs uppercase tracking-[0.2em] text-slate-400 font-light
```

### Font Weights
```
Display font:  font-display
Semibold:      font-semibold (for key words in headings)
Light:         font-light (all body text)
Thin:          font-thin (decorative labels like "Welcome to")
```

---

## 🎨 Color Palette

### Primary Accent Color
```
Gold:           #d4af37
Usage:          CTAs, icons, decorative elements, hover states
```

### Gold Opacity Scale
```
Text/Icons:     text-[#d4af37]          (100% - use directly)
Background:     bg-[#d4af37]/10         (10% - badges, backgrounds)
Hover:          bg-[#d4af37]/20         (20% - interactive hover)
Subtle:         bg-[#d4af37]/5          (5% - floating accents)
Faint:          bg-[#d4af37]/3          (3% - very subtle overlays)
Border:         border-[#d4af37]        (100% - divider lines)
Border subtle:  border-[#d4af37]/20     (20% - subtle borders)
Border faint:   border-[#d4af37]/30     (30% - very subtle)
```

### Neutral Colors
```
Text dark:      text-slate-900          (headings)
Text medium:    text-slate-600          (body text)
Text light:     text-slate-400          (captions)
Text white:     text-white              (light backgrounds)
White opacity:  text-white/85, text-white/70, text-white/50
```

### Background Colors
```
Dark sections:  bg-slate-800, bg-slate-900, bg-black
Light sections: bg-white, bg-slate-50
Gradients:      from-slate-950 via-slate-900 to-slate-950
                from-white via-slate-50 to-white
```

---

## 🔘 Button System

### Button Sizing
```
Size prop:      size="lg"
```

### Button Variants

#### Primary Button (Main CTA)
```
bg-white text-slate-900
border-2 border-white
hover:bg-[#d4af37] hover:border-[#d4af37]
```

#### Secondary Button (Alternative CTA)
```
bg-transparent text-white
border-2 border-white/60
hover:bg-white hover:text-slate-900 hover:border-[#d4af37]
```

#### Tertiary Button (Link style)
```
bg-transparent text-[#d4af37]
border-0
hover:text-slate-900
```

### Button Padding
```
Primary/Secondary:  px-10 py-6
Large CTA:          px-12 py-6
Link buttons:       p-0 (no padding)
```

### Button Styling
```
Border radius:      rounded-sm
Transition:         transition-all duration-300
Shadow:             shadow-lg hover:shadow-xl
Icon size:          w-4 h-4
Icon spacing:       mr-2 (before text), ml-2 (after text)
```

---

## ✨ Animation System

### Standard Duration
```
All transitions:    duration-300 (300ms)
No longer:          300ms is the standard
```

### Icon Animations
```
Scale:              group-hover:scale-110
Rotate:             group-hover:rotate-180
Translate:          group-hover:translate-x-1
Duration:           duration-300 (applied to transform)
```

### Pulse Animations
```
Gentle pulse:       animate-pulse (decorative dots, accents)
Floating elements:  animate-pulse with animation-delay-1000
```

### Fade Animations
```
Fade in up:         animate-fade-in-up (staggered content)
Stagger delays:     animation-delay-200, -400, -500
```

---

## 🖼️ Decorative Elements

### Divider Lines
```
Style:              h-px w-16
Gradient:           bg-gradient-to-r from-transparent via-[#d4af37] to-transparent
Spacing:            mb-8, mb-10, mt-10 (above/below headings)
```

### Floating Accents
```
Size (large):       w-96 h-96
Size (medium):      w-80 h-80
Style:              rounded-full blur-3xl
Colors:             bg-[#d4af37]/5 or /3
Animation:          animate-pulse
Stagger:            animation-delay-1000 (second element)
Position:           absolute (positioned in container)
```

### Badge Decorative Dots
```
Size:               w-1.5 h-1.5
Color:              bg-[#d4af37]
Shape:              rounded-full
Animation:          animate-pulse
Position:           inline-flex inside badge
```

### Pattern Overlay
```
Style:              radial-gradient
Point:              circle at 2px 2px
Color:              white 1px, transparent 0
Size:               background-size: 40px 40px (or 50px)
Opacity:            opacity-3 (very subtle)
```

---

## 📱 Responsive Breakpoints

```
Mobile:             < 768px           (default, no prefix)
Tablet:             md: ≥ 768px
Desktop:            lg: ≥ 1024px
Large desktop:      xl: ≥ 1280px (optional)
```

### Typography Breakpoints
```
Heading scaling:
  Mobile:          text-4xl
  Tablet (md):     text-5xl
  Desktop (lg):    text-6xl

Body text scaling:
  Mobile:          text-base
  Tablet (md):     text-lg

Description scaling:
  Mobile:          text-base
  Tablet (md):     text-lg
```

---

## 🎯 Icon System

### Icon Sizes

#### Default Icons
```
Size:               w-4 h-4 (most UI icons)
Component:         Badge icon, button icon
```

#### Large Icons
```
Size:               w-6 h-6 (section icons - minimize use)
Component:         Info bar icons
```

#### Extra Large Icons
```
Size:               w-14 h-14 (emphasis only)
Component:         Final CTA Sparkles icon
```

#### Hero Icons
```
Size:               w-5 h-5 (hero section only)
Component:         Award icon in badge
```

### Icon Colors
```
Accent:             text-[#d4af37]
White:              text-white
Gray:               text-slate-400
```

---

## 🌟 Shadow System

### Standard Shadows
```
Light shadow:       shadow-sm (rarely used)
Default shadow:     shadow-lg
Hover shadow:       shadow-xl
Deep shadow:        shadow-2xl (hero drop shadows only)
Colored shadow:     hover:shadow-[color]/opacity (use sparingly)
```

### Text Shadows
```
Hero heading:       drop-shadow-2xl
Description:        drop-shadow-lg
Default:            no shadow
```

---

## 🎪 Border System

### Border Radius
```
Buttons:            rounded-sm
Badges:             rounded-full
Cards:              rounded-lg
Dividers/Lines:     no radius (h-px w-px)
```

### Border Width
```
Button borders:     border-2 (CTAs)
Default borders:    border (regular)
Strong borders:     border-2
Badge borders:      border (subtle)
```

---

## 🎬 Glassmorphism Effects

### Glass Cards
```
Background:         glass (use existing class)
Border:             border border-white/20
Backdrop:           backdrop-blur-md
Background opacity: bg-white/5 (hover: bg-white/10)
```

### Glass Buttons
```
Background:         glass (optional - can use plain)
Border:             border-2
Transition:         transition-all duration-300
```

---

## 📊 Component Standards

### Section Container
```
Class:              container mx-auto px-4
Padding:            py-32
Max width:          max-w-7xl (in grid containers)
Margin:             mx-auto
```

### Grid System
```
Columns:            grid-cols-1 (mobile)
Tablet:             md:grid-cols-2, md:grid-cols-3
Gap:                gap-8, gap-10 (consistent)
```

### Flex Container
```
Direction:          flex flex-col sm:flex-row
Justify:            justify-center, items-center
Gap:                gap-4, gap-6
```

---

## 🔍 Best Practices

### Consistency Checklist
- [ ] All headings use correct hierarchy (H1, H2, H3)
- [ ] All buttons have consistent padding/sizing
- [ ] All icons are w-4 h-4 (unless special case)
- [ ] All transitions use duration-300
- [ ] All gold accents use #d4af37
- [ ] All section padding is py-32
- [ ] All margins follow mb-8/mb-12/mb-16 system
- [ ] All tracking uses consistent values

### When Adding New Components
1. Use existing button variants (don't create new ones)
2. Apply heading hierarchy consistently
3. Use established spacing values only
4. Keep animations to 300ms duration
5. Use gold accent color for emphasis
6. Apply border-radius consistently
7. Test on mobile (md:), tablet, and desktop (lg:)

---

## 📝 Quick Copy-Paste Snippets

### Section Container
```tsx
<section className="py-32 bg-gradient-to-b from-white to-slate-50 relative overflow-hidden">
  <div className="container mx-auto px-4">
    {/* content */}
  </div>
</section>
```

### Heading with Divider
```tsx
<span className="text-xs uppercase tracking-[0.2em] text-[#d4af37] font-light">Label</span>
<h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-light mb-12">
  Title <span className="font-semibold">Emphasis</span>
</h2>
```

### Primary Button
```tsx
<Button size="lg" className="px-10 py-6 rounded-sm bg-white text-slate-900 
                  hover:bg-[#d4af37] border-2 border-white hover:border-[#d4af37] 
                  transition-all duration-300 shadow-lg hover:shadow-xl">
  <Sparkles className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-300" />
  CTA TEXT
</Button>
```

### Grid of Cards
```tsx
<div className="grid md:grid-cols-3 gap-10">
  {items.map((item) => (
    <div className="group border border-white/50 hover:border-[#d4af37] 
                    transition-all duration-300 p-8 rounded-lg">
      {/* card content */}
    </div>
  ))}
</div>
```

---

## ✅ Standards Validation

All established standards have been:
- ✅ Applied to premium-hero-section.tsx
- ✅ Documented here for reference
- ✅ Ready for extension to other components
- ✅ Tested for consistency
- ✅ Validated with TypeScript
- ✅ Responsive on all devices

Use this document as the source of truth for all future design work!
