import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Achievement } from './types';

interface AchievementShareProps {
  achievement: Achievement;
  onClose: () => void;
}

export const AchievementShare: React.FC<AchievementShareProps> = ({
  achievement,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  const shareText = `🎉 I just unlocked the "${achievement.title}" achievement in Better Me!\n${achievement.description}\n\nJoin me on my self-improvement journey! 💪`;

  const shareOptions = [
    {
      name: 'Copy',
      icon: '📋',
      action: async () => {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
    },
    {
      name: 'Twitter',
      icon: '🐦',
      action: () => {
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
          '_blank'
        );
      },
    },
    {
      name: 'WhatsApp',
      icon: '💬',
      action: () => {
        window.open(
          `https://wa.me/?text=${encodeURIComponent(shareText)}`,
          '_blank'
        );
      },
    },
  ];

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
          className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Share Achievement</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="flex items-center space-x-3 mb-2">
              {React.createElement(achievement.icon, {
                className: "w-6 h-6",
                "aria-hidden": true,
                size: 24
              })}
              <span className="font-semibold">{achievement.title}</span>
            </div>
            <p className="text-gray-600">{achievement.description}</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {shareOptions.map((option) => (
              <motion.button
                key={option.name}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
                onClick={option.action}
              >
                <span className="text-2xl mb-2">{option.icon}</span>
                <span className="text-sm">
                  {option.name === 'Copy' && copied ? 'Copied!' : option.name}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
