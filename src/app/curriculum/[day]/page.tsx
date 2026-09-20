import { notFound } from 'next/navigation';
import { LessonScreen } from '@/components/curriculum/LessonScreen';
import { CURRICULUM, getMilestone } from '@/lib/curriculum/plan';

export function generateStaticParams() {
  return CURRICULUM.map((d) => ({ day: String(d.day) }));
}

export async function generateMetadata({ params }: { params: Promise<{ day: string }> }) {
  const { day } = await params;
  const m = getMilestone(Number(day));
  return {
    title: m ? `Day ${m.day}: ${m.title} — Tajweed Engine` : 'Lesson not found',
    description: m?.objective,
  };
}

export default async function LessonPage({ params }: { params: Promise<{ day: string }> }) {
  const { day } = await params;
  const milestone = getMilestone(Number(day));
  if (!milestone) notFound();
  return <LessonScreen milestone={milestone} />;
}
