# Musical Staff Widget Enhancements

## 🎵 New Features Implemented

### 1. Auto-Scroll on Widget Open

- **Feature**: Widget automatically starts recording when opened
- **Setting**: `autoScroll` (default: true)
- **Behavior**: Eliminates the need to manually click "Record" button

### 2. Continuous Scrolling

- **Feature**: Notes move smoothly from right to left in real-time
- **Setting**: `continuousScroll` (default: true)
- **Behavior**:
  - Notes appear at 90% width and scroll left based on time
  - Configurable scroll speed (10-200 pixels/second)
  - Smooth animations with CSS transitions

### 3. Show/Hide Incorrect Notes

- **Feature**: Option to display or hide notes that are more than 30 cents off
- **Setting**: `showIncorrectNotes` (default: true)
- **Behavior**:
  - Accurate notes (±30 cents): Always shown if clarity threshold met
  - Incorrect notes (>30 cents): Can be hidden for cleaner display

### 4. Settings Sidebar

- **Feature**: Collapsible sidebar with all widget settings
- **Toggle**: Settings button in header
- **Organization**: Grouped settings by category

## 🎛️ Settings Categories

### Auto-Scroll Settings

- **Auto-start when widget opens**: Checkbox to enable/disable auto-recording
- **Continuous scrolling**: Toggle time-based vs static positioning
- **Scroll Speed**: Slider (10-200 px/s) for continuous scroll rate

### Note Display Settings

- **Show incorrect notes**: Toggle display of notes >30 cents off
- **Buffer Size**: Number of notes to keep in memory (50-500)
- **Min Clarity**: Minimum clarity threshold for note display (0.1-0.9)

### Visual Improvements

- **Color Legend**: Visual guide for note accuracy colors
- **Status Indicators**: Real-time display of recording status and note counts
- **Smooth Animations**: CSS transitions for note movement

## 🎨 User Interface Improvements

### Header Redesign

- **Icons**: Added Play/Stop, Rotate, and Settings icons using Lucide React
- **Status Bar**: Shows recording status, note count, tick count, and scroll state
- **Compact Layout**: More efficient use of space

### Settings Sidebar

- **Organized Sections**: Grouped related settings logically
- **Visual Feedback**: Checkboxes, sliders, and real-time updates
- **Collapsible**: Can be hidden when not needed
- **Scrollable**: Handles overflow for smaller widget sizes

## 🔧 Technical Implementation

### Continuous Scrolling Algorithm

```typescript
const getNoteLeft = (index, total, noteTimestamp) => {
  if (!continuousScroll) {
    // Static positioning (original behavior)
    return calculateStaticPosition(index, total);
  }

  // Time-based positioning
  const now = Date.now();
  const timeElapsed = now - noteTimestamp;
  const pixelsToMove = (timeElapsed / 1000) * scrollSpeed;
  const startPosition = 90; // Start at 90% width
  const currentPosition = Math.max(
    5,
    startPosition - (pixelsToMove / window.innerWidth) * 100
  );

  return `${currentPosition}%`;
};
```

### Animation Frame Loop

- Uses `requestAnimationFrame` for smooth 60fps updates
- Only runs when continuous scroll is enabled and widget is recording
- Efficiently triggers re-renders to update note positions

### Note Accuracy Detection

```typescript
const isAccurate = Math.abs(centsDifference) <= 30; // ±30 cents threshold
const shouldShow = clarity > minClarity && (isAccurate || showIncorrectNotes);
```

## 🎯 Benefits

### For Musicians

1. **Immediate Feedback**: No need to manually start recording
2. **Cleaner Display**: Option to hide incorrect notes for better focus
3. **Real-time Visualization**: Continuous scrolling shows timing and rhythm
4. **Customizable Experience**: Adjustable settings for different practice needs

### For Developers

1. **Modular Design**: Settings organized in clear categories
2. **Performance Optimized**: Efficient animation loops and re-rendering
3. **Backward Compatible**: Maintains existing functionality while adding new features
4. **Extensible**: Easy to add new settings and features

## 🚀 Usage Examples

### Practice Sessions

- Enable continuous scrolling with medium speed (50px/s)
- Hide incorrect notes for cleaner display
- Use with metronome for timing reference

### Analysis Mode

- Show all notes (including incorrect ones)
- Use static positioning for detailed examination
- Increase buffer size for longer analysis

### Performance Mode

- Auto-start enabled for immediate recording
- Fast scroll speed for real-time feedback
- High clarity threshold for clean display

## 📱 Responsive Design

The sidebar automatically adapts to different widget sizes:

- **Large widgets**: Full sidebar with all settings visible
- **Medium widgets**: Scrollable sidebar content
- **Small widgets**: Compact sidebar with essential settings only

All enhancements maintain the widget's responsive behavior and work well within the dashboard grid system.
