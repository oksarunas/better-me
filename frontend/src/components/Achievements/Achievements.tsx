import React, { useState, useEffect } from 'react';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { Card } from '../ui/Card';
import { motion, AnimatePresence } from 'framer-motion';
import { Achievement, AchievementFilters, AchievementStats as Stats, AchievementCategory } from './types';
import { AchievementFilterControls } from './AchievementFilters';
import { AchievementDetail } from './AchievementDetail';
import { AchievementNotification } from './AchievementNotification';
import { AchievementStatsDisplay } from './AchievementStats';
import { AchievementShare } from './AchievementShare';

import { 
  Sunrise, 
  Trophy, 
  Flame, 
  Target, 
  Brain,
  Moon,
  Medal,
  Dumbbell,
  Sparkles
} from 'lucide-react';

export const mockAchievements: Achievement[] = [
  {
    id: '1',
    title: 'Early Bird',
    description: 'Wake up early for 7 consecutive days',
    progress: 5,
    maxProgress: 7,
    unlocked: false,
    icon: Sunrise,
    category: 'sleep',
    points: 100,
    rarity: 'common',
    milestoneGroup: 'sleep_routine',
    milestoneLevel: 1,
    rewards: [
      {
        type: 'badge',
        title: 'Early Riser',
        description: 'Early morning champion',
        icon: Sunrise,
        value: 'early_riser_badge'
      }
    ]
  },
  {
    id: '2',
    title: 'Habit Master',
    description: 'Complete all daily habits for a week',
    progress: 6,
    maxProgress: 7,
    unlocked: false,
    icon: Trophy,
    category: 'habits',
    points: 200,
    rarity: 'rare',
    rewards: [
      {
        type: 'badge',
        title: 'Master of Habits',
        description: 'Achieved perfect habits',
        icon: Medal,
        value: 'habit_master_badge'
      }
    ]
  },
  {
    id: '3',
    title: 'Sleep Champion',
    description: 'Maintain good sleep schedule for a month',
    progress: 25,
    maxProgress: 30,
    unlocked: false,
    icon: Moon,
    category: 'sleep',
    points: 300,
    rarity: 'epic',
    milestoneGroup: 'sleep_routine',
    milestoneLevel: 2,
    rewards: [
      {
        type: 'theme',
        title: 'Night Theme',
        description: 'Unlock dark mode',
        icon: Moon,
        value: 'dark_theme'
      }
    ]
  },
  {
    id: '4',
    title: 'Meditation Master',
    description: 'Complete 10 meditation sessions',
    progress: 8,
    maxProgress: 10,
    unlocked: false,
    icon: Brain,
    category: 'mindfulness',
    points: 150,
    rarity: 'rare',
    rewards: [
      {
        type: 'feature',
        title: 'Guided Meditations',
        description: 'Unlock premium meditation content',
        icon: Brain,
        value: 'premium_meditations'
      }
    ]
  },
  {
    id: '5',
    title: 'Fitness Enthusiast',
    description: 'Log 5 workouts in a week',
    progress: 3,
    maxProgress: 5,
    unlocked: false,
    icon: Dumbbell,
    category: 'fitness',
    points: 150,
    rarity: 'common',
    rewards: [
      {
        type: 'badge',
        title: 'Fitness Rookie',
        description: 'Starting your fitness journey',
        icon: Dumbbell,
        value: 'fitness_rookie_badge'
      }
    ]
  }
];

export const Achievements: React.FC = () => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null);
  const [sharingAchievement, setSharingAchievement] = useState<Achievement | null>(null);
  const [filters, setFilters] = useState<AchievementFilters>({
    category: 'all',
    status: 'all',
    sortBy: 'progress'
  });

  const stats: Stats = {
    totalAchievements: mockAchievements.length,
    unlockedAchievements: mockAchievements.filter(a => a.unlocked).length,
    totalPoints: mockAchievements.reduce((sum, a) => sum + (a.unlocked ? a.points : 0), 0),
    categoryProgress: Object.fromEntries(
      ['habits', 'sleep', 'fitness', 'mindfulness', 'general'].map(category => [
        category,
        {
          total: mockAchievements.filter(a => a.category === category).length,
          unlocked: mockAchievements.filter(a => a.category === category && a.unlocked).length,
          points: mockAchievements
            .filter(a => a.category === category && a.unlocked)
            .reduce((sum, a) => sum + a.points, 0)
        }
      ])
    ) as Record<AchievementCategory, { total: number; unlocked: number; points: number }>,
    currentStreak: 5, // This would come from actual user data
    longestStreak: 12 // This would come from actual user data
  };

  const filteredAchievements = mockAchievements
    .filter(achievement => {
      if (filters.category !== 'all' && achievement.category !== filters.category) return false;
      if (filters.status === 'locked' && achievement.unlocked) return false;
      if (filters.status === 'unlocked' && !achievement.unlocked) return false;
      return true;
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case 'progress':
          return (b.progress / b.maxProgress) - (a.progress / a.maxProgress);
        case 'recent':
          if (a.unlockedAt && b.unlockedAt) return b.unlockedAt.getTime() - a.unlockedAt.getTime();
          return 0;
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  // Simulate achievement unlock
  useEffect(() => {
    const checkAchievements = () => {
      mockAchievements.forEach(achievement => {
        if (!achievement.unlocked && achievement.progress === achievement.maxProgress) {
          achievement.unlocked = true;
          achievement.unlockedAt = new Date();
          setUnlockedAchievement(achievement);
        }
      });
    };

    const interval = setInterval(checkAchievements, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6"
    >
      <motion.h2 
        className="text-2xl font-bold mb-6"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        Your Achievements
      </motion.h2>

      <AchievementStatsDisplay stats={stats} />

      <AchievementFilterControls
        filters={filters}
        onFilterChange={setFilters}
      />

      <AchievementNotification
        achievement={unlockedAchievement}
        onClose={() => setUnlockedAchievement(null)}
      />

      <AchievementDetail
        achievement={selectedAchievement}
        onClose={() => setSelectedAchievement(null)}
      />

      {sharingAchievement && (
        <AchievementShare
          achievement={sharingAchievement}
          onClose={() => setSharingAchievement(null)}
        />
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredAchievements.map((achievement) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
              onHoverStart={() => setHoveredId(achievement.id)}
              onHoverEnd={() => setHoveredId(null)}
              onClick={() => setSelectedAchievement(achievement)}
              className="cursor-pointer"
            >
              <Card className={`p-4 ${achievement.unlocked ? 'bg-green-50' : ''} h-full`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {React.createElement(achievement.icon, {
                    className: "w-6 h-6",
                    "aria-hidden": true,
                    size: 24
                  })}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{achievement.title}</h3>
                      <span className="text-sm px-2 py-0.5 rounded bg-opacity-10
                        ${achievement.rarity === 'legendary' ? 'bg-yellow-500 text-yellow-700' :
                          achievement.rarity === 'epic' ? 'bg-purple-500 text-purple-700' :
                          achievement.rarity === 'rare' ? 'bg-blue-500 text-blue-700' :
                          'bg-gray-500 text-gray-700'}"
                      >
                        {achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">{achievement.points} points</div>
                  </div>
                </div>
                <p className="text-gray-600 mt-2">{achievement.description}</p>
                <div className="mt-4">
                  <Progress
                    value={(achievement.progress / achievement.maxProgress) * 100}
                    className="h-2"
                  />
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-sm text-gray-500">
                      {achievement.progress} / {achievement.maxProgress}
                    </p>
                    {achievement.unlocked && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="text-sm text-blue-600 hover:text-blue-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSharingAchievement(achievement);
                        }}
                      >
                        Share 🔗
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>
              <AnimatePresence>
                {achievement.unlocked && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                  >
                    <Badge variant="success" className="ml-2">
                      Unlocked
                    </Badge>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Card>
          </motion.div>
        ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
