'use client';

import AnalyzerWidget from '@/components/tools/widgets/AnalyzerWidget';
import ClockWidget from '@/components/tools/widgets/ClockWidget';
import MetronomeWidget from '@/components/tools/widgets/MetronomeWidget';
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
  }
];

export default function HomePage({ params: { locale } }: { params: any }) {
  const t = useTranslations('HomePage');

  return (
    <MetronomeProvider>
      <div className="w-full h-screen overflow-hidden">
        <WidgetManager availableWidgets={availableWidgets} className="h-full" />
      </div>
    </MetronomeProvider>
  );
}
