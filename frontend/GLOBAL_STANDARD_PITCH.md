# Global Standard Pitch Configuration

## 🎵 Implementation Summary

Added a global Standard Pitch setting to the sidebar that centralizes pitch standard configuration across all components in the V1brate application.

## 🎛️ Global Settings Sidebar

### **New Standard Pitch Control**

- **Location**: Sidebar → Global Settings
- **Range**: 415 Hz - 466 Hz (with 0.1 Hz precision)
- **Default**: 440 Hz (A4 standard)
- **Display**: Shows current value in Hz

### **Quick Preset Buttons**

- **Baroque**: 415 Hz (Historical tuning)
- **Standard**: 440 Hz (Modern concert pitch)
- **Classical**: 442 Hz (Orchestra tuning)

### **Visual Interface**

- Real-time slider with min/max labels
- Current value display
- Preset buttons for common tunings
- Smooth visual feedback

## 🔧 Components Updated

### **1. UserPreferencesContext**

- ✅ Already had `standartPitch` state management
- ✅ Persists to backend via `userService.updateProfile()`
- ✅ Provides global access via `useUserPreferences()` hook

### **2. usePitchDetection Hook**

- ✅ Updated to use global `standartPitch` instead of hardcoded 440
- ✅ `frequencyToNote()` function now uses configurable standard
- ✅ Recalculates when standard pitch changes

### **3. MusicalStaffWidget**

- ✅ Added `useUserPreferences()` hook
- ✅ Updated `getNoteFrequency()` to use global standard
- ✅ Note accuracy calculations now based on global pitch

### **4. TunerWidget**

- ✅ Removed local tuning standard setting
- ✅ Added global standard pitch import
- ✅ Updated UI to show current global setting with reference to sidebar
- ✅ No longer has individual tuning standard controls

### **5. DroneNoteWidget**

- ✅ Added dynamic frequency calculation based on standard pitch
- ✅ `getDroneNotes()` function calculates all frequencies from global standard
- ✅ All drone note frequencies update when standard changes
- ✅ Display shows current standard pitch reference

### **6. FrequencyAnalyzerWidget**

- ✅ Updated frequency markers to include global standard pitch
- ✅ Standard pitch frequency highlighted with blue color
- ✅ Visual distinction for the reference frequency

### **7. MusicUtils**

- ✅ Updated `frequencyToNote()` to accept `standardPitch` parameter
- ✅ Updated `noteToFrequency()` to accept `standardPitch` parameter
- ✅ Updated `createPitchPoint()` to use configurable standard
- ✅ Backward compatible with default 440 Hz if no parameter provided

## 🎯 Features & Benefits

### **Centralized Configuration**

- Single source of truth for pitch standard
- No more conflicting settings across widgets
- Consistent behavior across all components

### **Historical Tuning Support**

- **Baroque (415 Hz)**: Historical period tuning
- **Standard (440 Hz)**: Modern concert pitch (ISO 16)
- **Classical (442 Hz)**: Common orchestra tuning
- **Custom Range**: Any value between 415-466 Hz

### **Real-time Updates**

- All components update immediately when standard changes
- No need to restart or reload widgets
- Smooth transitions with proper dependency management

### **User Experience**

- Visual feedback showing current standard in relevant widgets
- Clear indication of which components use the global setting
- Helpful guidance to find the setting in the sidebar

## 🔄 Migration Notes

### **Removed Local Settings**

- `TunerWidget`: No longer has individual tuning standard dropdown
- Components now show "Using global setting" with current value
- Links users to sidebar for changes

### **Enhanced Components**

- `DroneNoteWidget`: Shows "Standard: A = XXX Hz" in display
- `FrequencyAnalyzerWidget`: Highlights standard pitch frequency
- `TunerWidget`: References global setting with navigation hint

### **Backward Compatibility**

- All music utility functions maintain default 440 Hz parameters
- Existing widget settings are preserved for other properties
- Gradual migration of hardcoded values to global standard

## 🎨 Visual Indicators

### **Sidebar Setting**

```
Global Settings
├── Theme: Light/Dark/Auto
├── Notation: ABC/Do-Ré-Mi
├── Key: C/C#/D/etc.
└── Standard Pitch: [===●===] 440 Hz
    ├── Range: 415 ——————— 466
    └── Presets: [Baroque] [Standard] [Classical]
```

### **Widget References**

- **TunerWidget**: "Using global setting: A = 440 Hz"
- **DroneNoteWidget**: "Standard: A = 440 Hz" below frequency
- **FrequencyAnalyzerWidget**: Blue highlighted line at standard frequency

## 🚀 Usage Examples

### **Period Performance**

- Set to 415 Hz for Baroque music
- All tuning, analysis, and drone components align
- Consistent historical pitch across session

### **Orchestra Practice**

- Set to 442 Hz for ensemble work
- Tuner shows accurate cents deviation
- Drone notes provide correct reference pitches

### **Modern Recording**

- Keep at 440 Hz for standard tuning
- All components use ISO 16 reference
- Perfect for contemporary music production

This implementation provides a comprehensive, user-friendly solution for pitch standard management across the entire V1brate application! 🎵
