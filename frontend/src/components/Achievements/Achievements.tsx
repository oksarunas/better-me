import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { Achievement, AchievementFilters, Stats } from './types';

export const Achievements: React.FC = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AchievementFilters>({
    category: 'all',
    status: 'all',
    sortBy: 'progress',
  });

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/achievements');
        setAchievements(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to load achievements.');
      } finally {
        setLoading(false);
      }
    };
    fetchAchievements();
  }, []);

  const stats: Stats = {
    totalAchievements: achievements.length,
    unlockedAchievements: achievements.filter(a => a.unlocked).length,
    totalPoints: achievements.reduce((sum, a) => sum + (a.unlocked ? a.points : 0), 0),
    // ... other stats
  };

  const filteredAchievements = achievements
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
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  const handleFilterChange = (filterType: keyof AchievementFilters, value: string) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6">
      <h2 className="text-2xl font-bold mb-6">Your Achievements</h2>
      
      {/* Stats Display */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Achievements</p>
          <p className="text-xl font-bold">{stats.totalAchievements}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Unlocked</p>
          <p className="text-xl font-bold">{stats.unlockedAchievements}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Points</p>
          <p className="text-xl font-bold">{stats.totalPoints}</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select 
          value={filters.category} 
          onChange={(e) => handleFilterChange('category', e.target.value)}
          className="border rounded p-2"
        >
          <option value="all">All Categories</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
        <select 
          value={filters.status} 
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="border rounded p-2"
        >
          <option value="all">All Status</option>
          <option value="locked">Locked</option>
          <option value="unlocked">Unlocked</option>
        </select>
        <select 
          value={filters.sortBy} 
          onChange={(e) => handleFilterChange('sortBy', e.target.value)}
          className="border rounded p-2"
        >
          <option value="progress">Progress</option>
          <option value="alphabetical">Alphabetical</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAchievements.map(achievement => (
          <Card key={achievement.id} className={`p-4 ${achievement.unlocked ? 'bg-green-50' : ''}`}>
            <div className="flex items-start">
              {React.createElement(achievement.icon, { className: 'w-6 h-6' })}
              <div className="ml-2">
                <h3 className="text-lg font-semibold">{achievement.title}</h3>
                <p className="text-gray-600">{achievement.description}</p>
                <Progress value={(achievement.progress / achievement.maxProgress) * 100} />
                <p className="text-sm text-gray-500">
                  {achievement.progress} / {achievement.maxProgress}
                </p>
                {achievement.unlocked && <Badge variant="success">Unlocked</Badge>}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </motion.div>
  );
};

export const mockAchievements = [
    // your mock achievements data
];