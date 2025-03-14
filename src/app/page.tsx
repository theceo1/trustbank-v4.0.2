'use client';

import { HeroSection } from '@/components/home/HeroSection';
import { VisionBoard } from '@/components/home/VisionBoard';
import { FeatureShowcase } from '@/components/home/FeatureShowcase';
import { UserFeedback } from '@/components/home/UserFeedback';
import { CallToAction } from '@/components/home/CallToAction';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <VisionBoard />
      <FeatureShowcase />
      <UserFeedback />
      <CallToAction />
    </main>
  );
}
