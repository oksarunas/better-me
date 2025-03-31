import { LucideIcon, LucideProps } from 'lucide-react';
import React from 'react';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  icon: React.ComponentType<LucideProps>;
  category: AchievementCategory;
  unlockedAt?: Date;
  points: number;
  rarity: AchievementRarity;
  milestoneGroup?: string;
  milestoneLevel?: number;
  rewards?: AchievementReward[];
}

export interface AchievementReward {
  type: 'badge' | 'points' | 'feature' | 'theme';
  title: string;
  description: string;
  icon: React.ComponentType<LucideProps>;
  value: string | number;
}

export interface AchievementStats {
  totalAchievements: number;
  unlockedAchievements: number;
  totalPoints: number;
  categoryProgress: Record<AchievementCategory, {
    total: number;
    unlocked: number;
    points: number;
  }>;
  currentStreak: number;
  longestStreak: number;
}

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export type AchievementCategory = 'habits' | 'sleep' | 'fitness' | 'mindfulness' | 'general';

export interface AchievementFilters {
  category: AchievementCategory | 'all';
  status: 'all' | 'locked' | 'unlocked';
  sortBy: 'progress' | 'recent' | 'alphabetical';
}

export interface Stats {
  totalAchievements: number;
  unlockedAchievements: number;
  totalPoints: number;
}
