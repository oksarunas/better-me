import React, { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle, LineChart, Zap } from 'lucide-react';
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import Footer from '../../components/Footer';
import { googleSignInApi } from '../../api';
import { useAuth } from '../../contexts/AuthContext';

const CLIENT_ID = "1082509608270-drlp7f9h7hr70q16mfv9q3cv7pqk6jqi.apps.googleusercontent.com";

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/tracker");
    }
  }, [isAuthenticated, navigate]);

  const handleDemoLogin = async () => {
    try {
      const result = await googleSignInApi('demo');
      console.log('Demo Login Success:', result);
      login(result.access_token, result.user); // Pass user object
    } catch (error) {
      console.error('Demo Login Error:', error);
    }
  };

  const handleCredentialResponse = useCallback(async (response: any) => {
    console.log('Google sign-in response received:', { hasCredential: !!response?.credential });
    try {
      const idToken = response.credential;
      if (!idToken) {
        console.error('No ID token received from Google');
        return;
      }

      console.log('Sending ID token to backend...');
      const result = await googleSignInApi(idToken);

      if (!result?.access_token) {
        console.error('Invalid response from backend:', result);
        return;
      }

      console.log('Google sign-in successful, logging in user');
      login(result.access_token, result.user); // Pass user object
    } catch (err) {
      console.error('Error during Google sign-in:', err);
      if (err instanceof Error) {
        console.error('Error details:', err.message);
      }
      console.error('Full error object:', JSON.stringify(err, null, 2));
    }
  }, [login]);

  useEffect(() => {
    const initializeGoogleClient = () => {
      if (!(window as any).google?.accounts?.id) {
        console.log('Waiting for Google client to load...');
        return;
      }

      try {
        console.log('Initializing Google client...');
        (window as any).google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true
        });

        (window as any).google.accounts.id.renderButton(
          document.getElementById('googleSignInButton'),
          { theme: 'outline', size: 'large' }
        );

        console.log('Google client initialized successfully');
      } catch (err) {
        console.error('Error initializing Google client:', err);
      }
    };

    initializeGoogleClient();
    const retryInterval = setInterval(() => {
      if ((window as any).google?.accounts?.id) {
        initializeGoogleClient();
        clearInterval(retryInterval);
      }
    }, 1000);

    return () => clearInterval(retryInterval);
  }, [handleCredentialResponse]);

  const handleGoogleSignIn = () => {
    const googleObj = (window as any).google;
    if (!googleObj?.accounts?.id) {
      console.error('Google client not available');
      return;
    }
    
    try {
      googleObj.accounts.id.prompt((notification: { isNotDisplayed: () => any; isSkippedMoment: () => any; }) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.log('Google Sign-In prompt not displayed or skipped');
        }
      });
    } catch (err) {
      console.error('Error showing Google Sign-In prompt:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950">
      <main className="container mx-auto px-4 py-16 flex flex-col items-center">
        <div className="text-center space-y-6 max-w-3xl mx-auto mb-20">
          <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
            Welcome to Better Me
          </h1>
          <p className="text-xl md:text-2xl text-gray-400">
            Track your habits and build a better version of yourself, one day at a time.
          </p>
          <div className="flex flex-col items-center space-y-4">
            <div id="googleSignInButton" className="mt-4"></div>
            <Button 
              size="lg" 
              className="group mt-4 hidden" 
              onClick={handleGoogleSignIn}
              id="fallbackGoogleButton"
            >
              Sign in with Google
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <button onClick={handleDemoLogin} style={{ marginTop: '20px' }}>
              Try Demo
            </button>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-8 w-full max-w-5xl">
          <Card className="p-6 bg-gray-900/50 backdrop-blur border-gray-800 hover:border-gray-700 transition-all hover:-translate-y-1">
            <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-6">
              <CheckCircle className="h-6 w-6 text-emerald-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Track daily habits</h3>
            <p className="text-gray-400">
              Stay consistent with your goals through our intuitive tracking system.
            </p>
          </Card>
          <Card className="p-6 bg-gray-900/50 backdrop-blur border-gray-800 hover:border-gray-700 transition-all hover:-translate-y-1">
            <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-6">
              <LineChart className="h-6 w-6 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Monitor progress</h3>
            <p className="text-gray-400">
              Watch your improvements over time with detailed analytics and insights.
            </p>
          </Card>
          <Card className="p-6 bg-gray-900/50 backdrop-blur border-gray-800 hover:border-gray-700 transition-all hover:-translate-y-1">
            <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-6">
              <Zap className="h-6 w-6 text-purple-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Stay motivated</h3>
            <p className="text-gray-400">
              Build streaks and achieve more with rewards and milestone celebrations.
            </p>
          </Card>
        </div>
        <Footer />
      </main>
    </div>
  );
};

export default LandingPage;