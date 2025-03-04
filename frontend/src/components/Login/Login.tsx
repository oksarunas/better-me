import axios from 'axios';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input";
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft } from 'lucide-react';

interface ErrorResponse {
    detail?: string;
    // Add other properties if needed
}

interface LoginResponse {
    access_token: string;
    user: any;
}

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
      const response = await axios.post(endpoint, payload);
      console.log('Response status:', response.status);
      
      const data = response.data as LoginResponse;
      console.log('Login successful, navigating to tracker');
      login(data.access_token, data.user);
      navigate('/tracker');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const errorData = err.response.data as ErrorResponse;
        console.error('Login error:', errorData);
        setError(errorData.detail || 'Authentication failed');
      } else if (err instanceof Error) {
        // Handle general error
        console.error('Login error:', err);
        setError(err.message);
      } else {
        // Handle other unexpected error types
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-6 bg-gray-900/50 backdrop-blur border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-white transition-colors"
            type="button"
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
          >
            {isRegistering ? 'Create Account' : 'Sign In'}
          </Button>
        </form>
        
        <div className="mt-4 text-center">
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-sm text-gray-400 hover:text-white transition-colors"
            type="button"
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