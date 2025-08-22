import { useAuth } from '../contexts/AuthContext';
import { MetronomeProvider } from '../contexts/MetronomeContext';
import RecordingWidget from '../components/widgets/RecordingWidget';
import TunerWidget from '../components/widgets/TunerWidget';
import MetronomeWidget from '../components/widgets/MetronomeWidget';
import ClockWidget from '../components/widgets/ClockWidget';
import WaveformWidget from '../components/widgets/WaveformWidget';
import DroneNoteWidget from '../components/widgets/DroneNoteWidget';
import StaffAnalyzerWidget from '../components/widgets/StaffAnalyzerWidget';
import WidgetManager, { WidgetConfig } from '../components/ui/WidgetManager';

const availableWidgets: WidgetConfig[] = [
  {
    id: 'tuner',
    title: 'Tuner',
    component: TunerWidget,
    defaultWidth: 400,
    defaultHeight: 500,
    category: 'tuning',
  },
  {
    id: 'metronome',
    title: 'Metronome',
    component: MetronomeWidget,
    defaultWidth: 350,
    defaultHeight: 450,
    category: 'rhythm',
  },
  {
    id: 'staff-analyzer',
    title: 'Staff Analyzer',
    component: StaffAnalyzerWidget,
    defaultWidth: 500,
    defaultHeight: 600,
    category: 'analysis',
  },
  {
    id: 'waveform',
    title: 'Waveform',
    component: WaveformWidget,
    defaultWidth: 500,
    defaultHeight: 300,
    category: 'analysis',
  },
  {
    id: 'drone-note',
    title: 'Drone Note',
    component: DroneNoteWidget,
    defaultWidth: 360,
    defaultHeight: 420,
    category: 'practice',
  },
  {
    id: 'recording',
    title: 'Recording',
    component: RecordingWidget,
    defaultWidth: 400,
    defaultHeight: 400,
    category: 'recording',
  },
  {
    id: 'clock',
    title: 'Clock',
    component: ClockWidget,
    defaultWidth: 250,
    defaultHeight: 200,
    category: 'practice',
  },
];

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <MetronomeProvider>
      <div className='w-full h-screen overflow-hidden relative bg-gradient-to-br from-gray-900 to-gray-800'>
        {/* Hover Sidebar */}
        <div className='group absolute left-0 top-0 h-full z-50'>
          {/* Visual Indicator when sidebar is hidden */}
          <div className='absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-blue-500/70 rounded-r-lg group-hover:opacity-0 transition-opacity duration-300 shadow-lg'>
            <div className='absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-400 rounded-full animate-pulse'></div>
          </div>

          {/* Compact Sidebar */}
          <div className='h-full w-64 bg-black/95 backdrop-blur-xl border-r border-white/20 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out shadow-2xl'>
            <div className='p-4 h-full flex flex-col'>
              <div className='mb-4'>
                <h2 className='text-lg font-bold text-white mb-1'>V1brate</h2>
                <p className='text-white/60 text-xs'>
                  Welcome back,{' '}
                  {user?.displayName || user?.username || 'Musician'}!
                </p>
              </div>

              {/* Widget Manager will be injected here */}
              <div id='sidebar-content' className='flex-1'>
                {/* Content will be moved here by WidgetManager */}
              </div>
            </div>
          </div>
        </div>

        <WidgetManager
          availableWidgets={availableWidgets}
          className='h-full'
          isDraggable={true}
          isResizable={true}
        />
      </div>
    </MetronomeProvider>
  );
}
