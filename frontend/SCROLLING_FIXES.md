# Musical Staff Widget Scrolling Fixes

## 🔧 Issues Fixed

### 1. **Scroll Speed Independent of Buffer Size and Window Width**

**Problem**: Scroll speed was dependent on window width and buffer size, causing inconsistent behavior.

**Solution**:

- Changed from pixel-based to percentage-based scrolling
- Speed is now measured in "percentage points per 10 seconds"
- Range: 20-100% per 10 seconds (2-10% per second)
- Consistent speed regardless of screen size or buffer settings

### 2. **Incorrect Notes Counted in Buffer**

**Problem**: All notes (including invisible/incorrect ones) were being counted in the buffer and affecting display logic.

**Solution**:

- Separated buffer management from display logic
- All detected notes are kept in buffer for data integrity
- Only `isVisible` notes are displayed on the staff
- Buffer size controls total notes stored, not just visible ones
- Status shows "visible/total" note count (e.g., "Notes: 12/25")

### 3. **All Buffer Notes Being Displayed**

**Problem**: The display system was showing all notes in the buffer regardless of visibility settings.

**Solution**:

- Enhanced visibility filtering in both static and continuous modes
- Static mode: Only visible notes get positioned, others are placed off-screen
- Continuous mode: All notes scroll but only visible ones render
- Proper `isVisible` flag handling throughout the rendering pipeline

## 🎯 Technical Implementation

### New Scroll Speed Calculation

```typescript
// Old: Inconsistent pixel-based speed
const pixelsToMove = (timeElapsed / 1000) * scrollSpeed;
const currentPosition =
  startPosition - (pixelsToMove / window.innerWidth) * 100;

// New: Consistent percentage-based speed
const scrollSpeedPercentage = scrollSpeed / 10; // Convert to reasonable percentage speed
const currentPosition = 95 - (timeElapsed / 1000) * scrollSpeedPercentage;
```

### Improved Buffer Management

```typescript
// Always add note to buffer regardless of visibility
const newNote = {
  note: fullNote,
  freq,
  clarity,
  timestamp,
  // Mark visibility but still keep in buffer
  isVisible: clarity > minClarity && (isAccurate || showIncorrectNotes),
};

// Add to buffer and maintain buffer size
const newNotes = [...prev, newNote];
return newNotes.slice(-noteCount); // Keep only last noteCount items
```

### Enhanced Static Positioning

```typescript
// Only show visible notes in static mode
const visibleNotes = latestNotes.filter((note) => note.isVisible);
const effectiveTotal = Math.max(visibleNotes.length, 1);
const visibleIndex =
  latestNotes.slice(0, index + 1).filter((note) => note.isVisible).length - 1;

if (visibleIndex < 0) return '-100%'; // Hide this note off-screen
```

## 🎛️ Updated Settings

### Scroll Speed Settings

- **Label**: "Scroll Speed: X% per 10s"
- **Range**: 20-100% per 10 seconds
- **Description**: "Lower = Slower scroll, Higher = Faster scroll"
- **Behavior**: Consistent speed regardless of screen size

### Buffer vs Display

- **Buffer Size**: Controls total notes kept in memory (50-500)
- **Show Incorrect Notes**: Controls which notes are visible
- **Min Clarity**: Controls minimum quality threshold
- **Status Display**: Shows "visible/total" count

## 🎵 User Experience Improvements

### Consistent Performance

- Scroll speed now behaves the same on all devices
- No more speed variations based on window size
- Predictable timing for musical practice

### Cleaner Display Options

- Can hide incorrect notes while keeping them in buffer
- Better separation of data collection vs visualization
- More accurate status information

### Better Buffer Management

- All detected notes preserved for analysis
- Display filtering doesn't affect data integrity
- Proper cleanup of old notes based on buffer size

## 📊 Status Bar Information

The status bar now shows:

- **Status**: Recording/Stopped state
- **Notes**: Visible notes / Total notes in buffer (e.g., "12/25")
- **Ticks**: Metronome beat markers
- **Continuous Scroll**: Active indicator when enabled

## 🚀 Benefits

1. **Predictable Scrolling**: Same speed on all devices and window sizes
2. **Data Integrity**: All notes preserved in buffer regardless of display settings
3. **Flexible Display**: Can show/hide incorrect notes without losing data
4. **Better Performance**: Efficient filtering and positioning logic
5. **Clear Feedback**: Accurate status information about what's being displayed vs stored
