import React from 'react';
import { motion } from 'framer-motion';
import { Achievement } from './types';

interface AchievementNotificationProps {
  achievement: Achievement | null;
  onClose: () => void;
}

export const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  achievement,
  onClose,
}) => {
  return (
    <>
      {achievement && (
        <motion.div
          initial={{ opacity: 0, y: -50, x: '-50%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-4">
            {React.createElement(achievement.icon, {
              className: "w-6 h-6 text-white",
              "aria-hidden": true,
              size: 24
            })}
            <div>
              <h3 className="font-bold text-lg">Achievement Unlocked!</h3>
              <p>{achievement.title}</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="ml-4 p-1 hover:bg-green-600 rounded"
            >
              ✕
            </motion.button>
          </div>
        </motion.div>
      )}
    </>
  );
};