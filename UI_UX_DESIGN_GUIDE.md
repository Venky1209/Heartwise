# 🎨 HeartWise UI/UX Design System - Complete Guide

## 🌈 Design Philosophy

**Medical + Modern + Motivational**

HeartWise combines professional medical aesthetics with modern, friendly design and positive user motivation. Every interaction should feel:
- **Calming** - Reduce anxiety with soothing colors and smooth animations
- **Encouraging** - Positive messaging and motivational quotes throughout
- **Professional** - Medical-grade accuracy with trust-building design
- **Delightful** - Smooth animations and thoughtful micro-interactions

---

## 🎨 Color Palette

### Primary Colors (Medical Blue)
- **Primary-50 to Primary-900**: Professional blue gradient
- Main brand: `#0ea5e9` (Primary-500)
- Use for: Main actions, headers, navigation, medical data

### Success Colors (Health Green)
- **Success-50 to Success-900**: Positive health indicators
- Main success: `#22c55e` (Success-500)
- Use for: Good health metrics, success states, positive feedback

### Warning Colors (Caution Amber)
- **Warning-50 to Warning-900**: Attention needed
- Main warning: `#f59e0b` (Warning-500)
- Use for: Moderate risk, caution states, pending actions

### Danger Colors (Alert Red)
- **Danger-50 to Danger-900**: Critical alerts
- Main danger: `#ef4444` (Danger-500)
- Use for: High risk, errors, critical alerts

### Heart Colors (Vital Rose)
- **Heart-50 to Heart-900**: Heartbeat and ECG focus
- Main heart: `#f43f5e` (Heart-500)
- Use for: ECG visualization, heartbeat animations, vital signs

---

## ✨ Animation Components

### 1. HeartbeatLoader
**When to use**: Primary loading indicator for ECG-related operations
```jsx
import { HeartbeatLoader } from '../components/Animations/Loaders';

<HeartbeatLoader message="Analyzing your heart rhythm..." size="md" />
```

**Variants**:
- Size: `sm`, `md`, `lg`
- Automatically shows random loading quote if no message provided

### 2. SpinnerLoader
**When to use**: General loading for non-ECG operations
```jsx
<SpinnerLoader size="md" color="primary" />
```

**Colors**: `primary`, `success`, `warning`, `danger`

### 3. ProgressBar
**When to use**: Show upload/download/analysis progress
```jsx
<ProgressBar 
  progress={75} 
  color="success" 
  showPercentage={true}
  label="Analyzing ECG data..."
/>
```

### 4. CircularProgress
**When to use**: Compact progress indicators, signal quality display
```jsx
<CircularProgress progress={95} size={120} color="success" />
```

### 5. ECGWaveLoader
**When to use**: ECG-specific operations with wave animation
```jsx
<ECGWaveLoader />
```

### 6. SkeletonLoader
**When to use**: Content loading placeholders
```jsx
<SkeletonLoader width="full" height="4" />
```

### 7. AnimatedCard
**When to use**: Interactive cards with hover effects
```jsx
<AnimatedCard onClick={() => navigate('/analysis')}>
  <h3>Latest Session</h3>
  <p>View details</p>
</AnimatedCard>
```

### 8. FadeIn & SlideIn
**When to use**: Page entrance animations
```jsx
<FadeIn delay={200} duration={500}>
  <Dashboard />
</FadeIn>

<SlideIn direction="left" delay={0}>
  <Sidebar />
</SlideIn>
```

### 9. SuccessCheckmark
**When to use**: Success confirmations
```jsx
<SuccessCheckmark size="md" />
```

---

## 💬 Motivational Quotes System

### Import and Usage
```jsx
import { 
  getRandomQuote, 
  getLoadingQuote, 
  getSuccessMessage,
  emptyStateMessages 
} from '../theme/quotes';

// Random health quote
const quote = getRandomQuote('motivation');

// Loading state
const loadingMsg = getLoadingQuote();

// Success message
const successMsg = getSuccessMessage();

// Empty state
const emptyState = emptyStateMessages.noSessions;
```

### Quote Categories
- `motivation` - General encouragement
- `awareness` - Health consciousness
- `lifestyle` - Healthy habits
- `prevention` - Proactive care
- `progress` - Journey tracking
- `wellness` - Holistic health

---

## 🎭 Animation Classes

### Pre-built Tailwind Animations

#### Entrance Animations
```jsx
className="animate-fade-in"        // Fade in with slide up
className="animate-fade-in-up"     // Fade in from below
className="animate-slide-up"       // Slide up
className="animate-slide-in-right" // Slide from right
className="animate-bounce-in"      // Bounce entrance
```

#### Attention Animations
```jsx
className="animate-heartbeat"      // Heartbeat pulse
className="animate-pulse-slow"     // Slow pulse
className="animate-pulse-fast"     // Fast pulse
className="animate-glow"           // Glowing effect
className="animate-wiggle"         // Subtle shake
className="animate-float"          // Floating effect
```

#### Loading Animations
```jsx
className="animate-shimmer"        // Shimmer effect
className="animate-spin"           // Spinning
className="animate-bounce-slow"    // Slow bounce
```

### Custom CSS Animations

#### Heartbeat Animation
```jsx
<div className="heartbeat-animation">
  {/* Your heart icon */}
</div>
```

#### ECG Wave Bars
```jsx
<div className="ecg-wave-bar">
  {/* Wave bar */}
</div>
```

#### Smooth Transitions
```jsx
className="smooth-transition"      // 300ms
className="smooth-transition-slow" // 500ms
```

#### Hover Effects
```jsx
className="hover-lift"    // Lift up on hover
className="hover-scale"   // Scale up on hover
className="hover-glow"    // Glow on hover
```

---

## 🎨 Component Examples

### Loading State with Quote
```jsx
{isLoading ? (
  <div className="flex flex-col items-center justify-center min-h-screen">
    <HeartbeatLoader message={getLoadingQuote()} size="lg" />
    <p className="mt-4 text-sm text-gray-600 italic">
      "{getRandomQuote('motivation').text}"
    </p>
  </div>
) : (
  <YourContent />
)}
```

### Empty State
```jsx
const emptyState = emptyStateMessages.noSessions;

<div className="text-center py-16">
  <div className="text-6xl mb-4">🫀</div>
  <h3 className="text-2xl font-bold text-gray-900 mb-2">
    {emptyState.title}
  </h3>
  <p className="text-gray-600 mb-6">
    {emptyState.description}
  </p>
  <button className="btn-primary">
    {emptyState.cta}
  </button>
</div>
```

### Success State
```jsx
<div className="flex flex-col items-center py-8">
  <SuccessCheckmark size="lg" />
  <h3 className="text-xl font-bold text-success-600 mt-4">
    {getSuccessMessage()}
  </h3>
  <p className="text-gray-600 mt-2">
    "{getRandomQuote('progress').text}"
  </p>
</div>
```

### Animated Stats Card
```jsx
<AnimatedCard className="p-6">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm text-gray-600">Heart Rate</p>
      <p className="text-3xl font-bold text-gray-900 count-up-animation">
        78 <span className="text-lg">BPM</span>
      </p>
    </div>
    <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center">
      <span className="text-2xl animate-heartbeat">❤️</span>
    </div>
  </div>
</AnimatedCard>
```

### Progress Analysis
```jsx
<div className="space-y-4">
  <div className="flex justify-between items-center">
    <span className="font-medium">Analyzing ECG Signal</span>
    <CircularProgress progress={analysisProgress} size={60} />
  </div>
  
  <ProgressBar 
    progress={analysisProgress} 
    color="primary"
    label="Processing..."
  />
  
  <p className="text-sm text-gray-600 text-center animate-pulse">
    {getLoadingQuote()}
  </p>
</div>
```

---

## 🎯 Best Practices

### 1. Always Show Progress
- Use loaders for any operation > 200ms
- Show progress bars for operations with measurable progress
- Provide feedback for user actions within 100ms

### 2. Use Motivational Messaging
- Add quotes to loading states
- Show encouraging messages on success
- Provide helpful guidance on errors
- Use positive language throughout

### 3. Smooth Transitions
- Fade in/out instead of instant show/hide
- Use easing functions for natural motion
- Stagger animations for multiple elements
- Keep animations under 500ms for responsiveness

### 4. Accessibility
- Maintain color contrast ratios (WCAG AA)
- Provide alternative text for animations
- Allow users to reduce motion (prefers-reduced-motion)
- Ensure keyboard navigation works smoothly

### 5. Performance
- Use CSS animations over JavaScript when possible
- Avoid animating expensive properties (width, height)
- Use transform and opacity for best performance
- Lazy load animation components

---

## 📱 Responsive Design

### Breakpoints
```jsx
sm: '640px'   // Mobile landscape
md: '768px'   // Tablet
lg: '1024px'  // Desktop
xl: '1280px'  // Large desktop
2xl: '1536px' // Extra large
```

### Mobile-First Approach
```jsx
<div className="p-4 md:p-6 lg:p-8">
  <h1 className="text-2xl md:text-3xl lg:text-4xl">
    Welcome to HeartWise
  </h1>
</div>
```

---

## 🚀 Quick Start

### 1. Import Theme
```jsx
import theme from '../theme/theme';
import '../styles/animations.css';
```

### 2. Use Animations
```jsx
import { HeartbeatLoader, AnimatedCard } from '../components/Animations/Loaders';
```

### 3. Add Quotes
```jsx
import { getRandomQuote, getLoadingQuote } from '../theme/quotes';
```

### 4. Apply Classes
```jsx
<div className="animate-fade-in hover-lift">
  Your content
</div>
```

---

## 🎨 Design Tokens Summary

| Token | Value | Usage |
|-------|-------|-------|
| Primary | #0ea5e9 | Main actions, branding |
| Success | #22c55e | Positive metrics, health |
| Warning | #f59e0b | Moderate alerts |
| Danger | #ef4444 | Critical alerts |
| Heart | #f43f5e | ECG, heartbeat |
| Shadow-Card | 0 10px 15px | Elevated cards |
| Shadow-Glow | 0 0 15px | Interactive elements |
| Duration-Fast | 150ms | Quick feedback |
| Duration-Base | 300ms | Standard transitions |
| Duration-Slow | 500ms | Page transitions |

---

## 💡 Tips for Implementation

1. **Start Small**: Apply animations to one page at a time
2. **Test Performance**: Monitor FPS and loading times
3. **User Feedback**: Gather feedback on animation speeds
4. **Iterate**: Adjust timing and easing based on usage
5. **Document**: Keep this guide updated with new patterns

---

**Remember**: Great UI is invisible - animations should enhance, not distract! 🎯
