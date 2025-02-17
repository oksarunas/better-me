import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input";
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft } from 'lucide-react';
import axios from 'axios';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Form submission started');
    setError('');

    const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegistering 
      ? { email, password, name }
      : { email, password };

    console.log('Sending request to:', endpoint);
    
    try {
      // Explicitly prevent default again to ensure it works across browsers
      e.preventDefault();
      
      try {
        const response = await axios.post(endpoint, payload);
        console.log('Response status:', response.status);
        
        if (response.status >= 400) {
          const errorData = response.data;
          console.error('Login error:', errorData);
          throw new Error(errorData.detail || 'Authentication failed');
        }

        const data = response.data;
        console.log('Login successful, navigating to tracker');
        login(data.access_token, data.user);
        navigate('/tracker');
      } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
          console.error('Login error:', error.response.data);
          throw new Error(error.response.data.detail || 'Authentication failed');
        } else {
          console.error('Network error:', error);
          throw new Error('Network error occurred');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-6 bg-gray-900/50 backdrop-blur border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-2xl font-bold text-center flex-1 mr-8">
            {isRegistering ? 'Create Account' : 'Sign In'}
          </h2>
        </div>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {isRegistering && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-1">
                Name
              </label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full"
                placeholder="Enter your name"
              />
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full"
              placeholder="Enter your email"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-1">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full"
              placeholder="Enter your password"
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            onClick={(e) => {
              console.log('Button clicked directly');
              // Only handle click if form submission fails
              if (!e.defaultPrevented) {
                handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
              }
            }}
          >
            {isRegistering ? 'Create Account' : 'Sign In'}
          </Button>
        </form>
        
        <div className="mt-4 text-center">
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            {isRegistering 
              ? 'Already have an account? Sign in'
              : 'Don\'t have an account? Create one'}
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Login;
