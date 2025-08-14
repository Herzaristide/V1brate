import AnalyzerWidget from '@/components/tools/widgets/AnalyzerWidget';
import ClockWidget from '@/components/tools/widgets/ClockWidget';
import MetronomeWidget from '@/components/tools/widgets/MetronomeWidget';
import MusicalStaffWidget from '@/components/tools/widgets/MusicalStaffWidget';
import NotesReadingWidget from '@/components/tools/widgets/NotesReadingWidget';
import TunerWidget from '@/components/tools/widgets/TunerWidget';
import WidgetManager, { WidgetConfig } from '@/components/ui/WidgetManager';
import { MetronomeProvider } from '@/contexts/MetronomeContext';
import { useTranslations } from 'next-intl';

const availableWidgets: WidgetConfig[] = [
  {
    id: 'tuner',
    title: 'Tuner',
    component: TunerWidget,
    defaultWidth: 400,
    defaultHeight: 500
  },
  {
    id: 'metronome',
    title: 'Metronome',
    component: MetronomeWidget,
    defaultWidth: 300,
    defaultHeight: 400
  },
  {
    id: 'analyzer',
    title: 'Frequency Analyzer',
    component: AnalyzerWidget,
    defaultWidth: 450,
    defaultHeight: 350
  },
  {
    id: 'clock',
    title: 'Clock',
    component: ClockWidget,
    defaultWidth: 250,
    defaultHeight: 150
  },
  {
    id: 'MusicalStaff',
    title: 'MusicalStaff',
    component: MusicalStaffWidget,
    defaultWidth: 400,
    defaultHeight: 500
  },
  {
    id: 'notesReading',
    title: 'Notes Reading',
    component: NotesReadingWidget,
    defaultWidth: 600,
    defaultHeight: 400
  }
];

export default function HomePage({ params: { locale } }: { params: any }) {
  const t = useTranslations('HomePage');

  return (
    <MetronomeProvider>
      <div className="w-full h-screen overflow-hidden relative">
        {/* Hover Sidebar */}
        <div className="group absolute left-0 top-0 h-full z-50">
          {/* Visual Indicator when sidebar is hidden */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-blue-500/70 rounded-r-lg group-hover:opacity-0 transition-opacity duration-300 shadow-lg">
            <div className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          </div>

          {/* Compact Sidebar */}
          <div className="h-full w-48 bg-black/95 backdrop-blur-xl border-r border-white/20 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out shadow-2xl">
            <div className="p-4 h-full flex flex-col">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-white mb-1">V1brate</h2>
                <p className="text-white/60 text-xs">Music Tools</p>
              </div>

              {/* Widget Manager will be injected here */}
              <div id="sidebar-content" className="flex-1">
                {/* Content will be moved here by WidgetManager */}
              </div>
            </div>
          </div>
        </div>

        <WidgetManager availableWidgets={availableWidgets} className="h-full" />
      </div>
    </MetronomeProvider>
  );
}
