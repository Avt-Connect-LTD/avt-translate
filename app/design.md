# Charlie-Web Design System

This document outlines the key design elements and patterns used in the Charlie-Web portfolio website, providing a comprehensive reference for creating websites with a similar design aesthetic.

## Brand Identity

The website follows a modern, sleek design with a dark theme, subtle gradients, and neon accents. It emphasizes a professional yet creative identity that balances software engineering and 3D artistry elements.

## Color Palette

### Base Colors

- **Background**: Gradient from `#0A090C` (dark charcoal) to `black`
- **Text**: White (`#FFFFFF`) with various opacity levels for hierarchy
- **Cards/UI Elements**: Black with 50% opacity (`bg-black/50`) with backdrop blur

### Accent Colors

- **Primary Blue**: `#4BC0FF` (used for Dev-related elements)
- **Vibrant Red**: `#FF2800` (used for FX/3D-related elements)
- **Yellow**: `#FFF94D` (used for CTA and highlight elements)
- **Green**: `#90FF94` (used for Design-related elements)

### Color Application

- Text uses white with varying opacity levels (100%, 80%, 70%, etc.) to create hierarchy
- Cards and UI elements use `backdrop-blur-sm` with `bg-black/50` for a frosted glass effect
- Border colors use white with low opacity (`border-white/5`) that increases on hover (`border-white/20`)
- Accent colors are used for categorization and hover effects

## Typography

### Font Family

- Primary font: Inter (variable font)
- Font is applied via: `font-[family-name:var(--font-inter)]`

### Font Sizes

- Hero text: `text-4xl sm:text-5xl md:text-6xl lg:text-7xl`
- Section headings: `text-3xl sm:text-4xl md:text-5xl lg:text-6xl`
- Subsection headings: `text-2xl sm:text-3xl`
- Card titles: `text-xl sm:text-2xl`
- Body text: `text-md` or `text-lg`
- Small text/captions: `text-sm`

### Font Weights

- Bold/Headers: `font-semibold` or `font-bold`
- Regular text: Default weight
- Emphasis: `font-medium`

## UI Components

### Cards

Cards are a primary UI element with these characteristics:

- Dark, semi-transparent backgrounds: `bg-black/50`
- Subtle backdrop blur: `backdrop-blur-sm`
- Rounded corners: `rounded-3xl`
- Thin, white borders with low opacity: `border border-white/5`
- Hover effects:
  - Border opacity increase: `hover:border-white/20` or with accent color
  - Subtle shadow: `hover:shadow-lg hover:shadow-blue-900/10`
  - Scale transformation: `hover:scale-1.02` (using Framer Motion)
- Transition: `transition-all duration-300 ease-in-out`

### Buttons & Interactive Elements

- Rounded full for buttons: `rounded-full`
- Semi-transparent backgrounds that lighten on hover
- Icon interactions increase brightness and scale: `hover:scale-110`
- Custom drop shadows on hover using accent colors

### Navigation

- Simple, minimalist navbar with logo and links
- Uses semi-transparent background with backdrop blur
- Links have subtle hover effects

### Project Cards

- Consistent height (400px)
- Featured image with subtle hover scale effect
- Tag system with color coding by category (Dev: blue, FX: red, Design: green)
- Metadata displayed with consistent formatting

## Layout Principles

### Grid System

- Responsive grid using Tailwind's grid system
- Desktop: Complex grid with varying column and row spans
  - `grid-cols-3` with custom row setup
  - `grid-rows-[100px_30px_20px_70px_20px_100px]`
- Tablet: Simplified 2-column grid
  - `md:grid-cols-2`
- Mobile: Single column
  - Default flex column layout

### Spacing

- Consistent gap system: `gap-4 sm:gap-6 md:gap-8`
- Section margins: `mt-6` or `mt-8` between major sections
- Padding: `p-4 sm:p-6` for most container elements

### Container Widths

- Max width container: `max-w-7xl mx-auto`
- Full-bleed elements use `w-full`
- Content sections use appropriate padding: `px-4 sm:px-6`

## Animation & Interaction

### Animation Patterns

All animations use Framer Motion with these patterns:

- Entry animations:
  - Fade in: `opacity: 0` to `opacity: 1`
  - Subtle upward movement: `y: 20` to `y: 0`
  - Slight scale increase: `scale: 0.9` to `scale: 1`
- Hover animations:
  - Scale increase: `whileHover={{ scale: 1.02 }}`
  - Border opacity changes
  - Shadow additions
- Staggered animations with delayed start times
  - Base delay: `delay: 0.2`
  - Incremental delays: `delay: 0.1 * index`

### Transition Properties

- Duration: Generally 0.3-0.5 seconds
  - `duration: 0.5` for entry animations
  - `duration: 0.3` for hover effects
- Easing: `ease-in-out` or `ease-out`
- Image transitions: Slightly longer `duration: 0.7` for smoother effect

## Special Effects

### Gradient & Glow Effects

- Radial gradient background: `bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.1),transparent_70%)]`
- Element hover glows using box shadows: `hover:shadow-lg hover:shadow-[#COLOR]/10`
- Icon glow effects: `hover:drop-shadow-[0_0_8px_rgba(255,0,0,0.5)]`

### Backdrop Blur

- Applied to most card elements: `backdrop-blur-sm`
- Creates depth and modern "frosted glass" effect

### Image Treatments

- Images have subtle hover scaling: `transition-transform duration-700 group-hover:scale-105`
- Dark overlays appear on hover: `bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100`

## Responsive Behavior

### Breakpoints

- Default (mobile): Base styles
- sm: Small devices (640px+)
- md: Medium devices (768px+)
- lg: Large devices (1024px+)

### Priority Content

- Hero section and main introduction always visible
- Some elements hide on mobile: `lg:block sm:hidden`
- Grid transforms to single column on mobile
- Typography scales down proportionally on smaller screens

## Component Examples

### Standard Card

```jsx
<div className="bg-black/50 backdrop-blur-sm rounded-3xl p-4 sm:p-6 text-white border border-white/5 hover:border-white/20 hover:shadow-lg hover:shadow-blue-900/10 transition-all duration-300 ease-in-out">
  {/* Card content */}
</div>
```

### Animated Section

```jsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, delay: 0.2 }}
  className="flex flex-col gap-4"
>
  {/* Section content */}
</motion.div>
```

### Accent Button

```jsx
<Link
  href="/contact"
  className="bg-black/30 backdrop-blur-sm border border-white/10 text-white hover:border-[#FFF94D]/50 px-6 py-3 rounded-full hover:shadow-lg hover:shadow-[#FFF94D]/10 transition-all duration-200 ease-out"
>
  Contact me
</Link>
```

### Project Card

```jsx
<div className="w-full h-[400px] card p-5 bg-black/50 backdrop-blur-sm rounded-xl transition-all duration-200 ease-out border border-white/5 hover:border-white/20 hover:shadow-lg hover:shadow-blue-900/5">
  <div className="relative h-[250px] overflow-hidden rounded-lg group">
    <Image
      src={project.image.url}
      alt={project.ProjectName}
      fill
      className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
  </div>
  <div className="mt-4">
    <h3 className="text-xl text-white font-semibold">{project.ProjectName}</h3>
    <p className="text-white/70 text-sm">{project.description}</p>
    {/* Tag system */}
  </div>
</div>
```
