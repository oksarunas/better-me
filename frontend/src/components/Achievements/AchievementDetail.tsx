import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Achievement } from './types';
import { Progress } from '../ui/Progress';
import { Badge } from '../ui/Badge';

interface AchievementDetailProps {
  achievement: Achievement | null;
  onClose: () => void;
}

export const AchievementDetail: React.FC<AchievementDetailProps> = ({
  achievement,
  onClose,
}) => {
  if (!achievement) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-4">
              {React.createElement(achievement.icon, {
                className: "w-8 h-8",
                "aria-hidden": true,
                size: 32
              })}
              <div>
                <h2 className="text-2xl font-bold">{achievement.title}</h2>
                <p className="text-gray-600">{achievement.description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Progress</h3>
              <Progress
                value={(achievement.progress / achievement.maxProgress) * 100}
                className="h-3"
              />
              <p className="text-sm text-gray-600 mt-1">
                {achievement.progress} / {achievement.maxProgress}
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <Badge variant={achievement.unlocked ? "success" : "secondary"}>
                {achievement.unlocked ? "Unlocked" : "Locked"}
              </Badge>
              <Badge variant="outline">
                Category: {achievement.category}
              </Badge>
              {achievement.unlockedAt && (
                <Badge variant="info">
                  Unlocked on: {achievement.unlockedAt.toLocaleDateString()}
                </Badge>
              )}
            </div>

            {achievement.unlocked && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-green-50 rounded-lg"
              >
                <h3 className="font-semibold text-green-800 mb-2">
                  🎉 Achievement Unlocked!
                </h3>
                <p className="text-green-700">
                  Congratulations on reaching this milestone! Keep up the great work!
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
