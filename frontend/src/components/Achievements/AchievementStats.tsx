import React from 'react';
import { motion } from 'framer-motion';
import { AchievementStats } from './types';
import { Progress } from '../ui/Progress';
import { Card } from '../ui/Card';

interface AchievementStatsDisplayProps {
  stats: AchievementStats;
}

export const AchievementStatsDisplay: React.FC<AchievementStatsDisplayProps> = ({ stats }) => {
  const categoryColors = {
    habits: 'bg-blue-500',
    sleep: 'bg-purple-500',
    fitness: 'bg-green-500',
    mindfulness: 'bg-yellow-500',
    general: 'bg-gray-500',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-2">Overall Progress</h3>
          <div className="text-3xl font-bold mb-2">
            {Math.round((stats.unlockedAchievements / stats.totalAchievements) * 100)}%
          </div>
          <Progress
            value={(stats.unlockedAchievements / stats.totalAchievements) * 100}
            className="h-2"
          />
          <p className="text-sm text-gray-600 mt-2">
            {stats.unlockedAchievements} / {stats.totalAchievements} Achievements
          </p>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-2">Total Points</h3>
          <div className="text-3xl font-bold mb-2">
            {stats.totalPoints.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">
            Points earned from achievements
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-2">Current Streak</h3>
          <div className="text-3xl font-bold mb-2">
            {stats.currentStreak} days 🔥
          </div>
          <div className="text-sm text-gray-600">
            Longest streak: {stats.longestStreak} days
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-2">Category Progress</h3>
          <div className="space-y-2">
            {Object.entries(stats.categoryProgress).map(([category, progress]) => (
              <div key={category} className="text-sm">
                <div className="flex justify-between mb-1">
                  <span className="capitalize">{category}</span>
                  <span>{Math.round((progress.unlocked / progress.total) * 100)}%</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${categoryColors[category as keyof typeof categoryColors]}`}
                    style={{ width: `${(progress.unlocked / progress.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  );
};
