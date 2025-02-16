import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { User, Settings, Bell } from 'lucide-react';
import { updateProfile, uploadAvatar } from '../../api/profile';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    notifications: true,
    darkMode: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      setError(null);
      const response = await uploadAvatar(file);
      // Update user context with new avatar URL
      if (response.avatar_url) {
        // TODO: Update user context
      }
    } catch (err) {
      setError('Failed to upload avatar');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);
      
      const updateData: { [key: string]: string | undefined } = {
        name: formData.name !== user?.name ? formData.name : undefined,
        email: formData.email !== user?.email ? formData.email : undefined,
      };

      // Only make the API call if there are changes
      if (Object.entries(updateData).some(([key, value]) => value !== undefined)) {
        const response = await updateProfile(updateData);
        // TODO: Update user context with new data
      }

      setIsEditing(false);
    } catch (err) {
      setError('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Profile Info Card */}
        <Card className="md:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Profile Information</h2>
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant="outline"
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </Button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Profile Picture */}
              <div className="flex items-center space-x-4">
                <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt="Profile"
                      className="h-20 w-20 rounded-full object-cover"
                      onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                        const img = e.currentTarget;
                        img.src = '/default-avatar.png';
                        img.onerror = null;
                      }}
                    />
                  ) : (
                    <User className="h-10 w-10 text-gray-400" />
                  )}
                </div>
                {isEditing && (
                  <>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    <Button
                      variant="outline"
                      type="button"
                      onClick={handleAvatarClick}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Uploading...' : 'Change Picture'}
                    </Button>
                  </>
                )}
              </div>

              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full p-2 border rounded-md"
                />
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full p-2 border rounded-md"
                />
              </div>

              {error && (
                <div className="text-red-500 text-sm mt-2">{error}</div>
              )}
              {isEditing && (
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              )}
            </div>
          </form>
        </Card>

        {/* Settings Cards */}
        <div className="space-y-6">
          {/* Notifications Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Notifications</h2>
              <Bell className="h-6 w-6 text-gray-400" />
            </div>
            <div className="flex items-center justify-between">
              <span>Enable Notifications</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="notifications"
                  checked={formData.notifications}
                  onChange={handleInputChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </Card>

          {/* Appearance Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Appearance</h2>
              <Settings className="h-6 w-6 text-gray-400" />
            </div>
            <div className="flex items-center justify-between">
              <span>Dark Mode</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="darkMode"
                  checked={formData.darkMode}
                  onChange={handleInputChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
