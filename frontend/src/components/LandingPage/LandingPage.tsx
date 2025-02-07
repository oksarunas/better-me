import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle, LineChart, Zap } from 'lucide-react';
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import Footer from '../../components/Footer';
import { googleSignInApi } from '../../api';

const CLIENT_ID = "1082509608270-drlp7f9h7hr70q16mfv9q3cv7pqk6jqi.apps.googleusercontent.com";

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  // Callback for handling the Google credential response
  const handleCredentialResponse = async (response: any) => {
    try {
      const idToken = response.credential; // The Google ID token
      console.log("Google ID token:", idToken);
      const result = await googleSignInApi(idToken);
      console.log("Server response:", result);
      navigate("/tracker");
    } catch (err) {
      console.error("Google sign-in error:", err);
    }
  };

  // Initialize the Google client when the component mounts, if available.
  useEffect(() => {
    if ((window as any).google && (window as any).google.accounts && (window as any).google.accounts.id) {
      (window as any).google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredentialResponse,
      });
      console.info("Google Identity Services initialized on mount.");
    } else {
      console.error("Google Identity Services not loaded on mount.");
    }
  }, [navigate]);

  // Custom handler to trigger the Google sign-in prompt,
  // reinitializing the client in case it wasn’t set up earlier.
  const handleGoogleSignIn = () => {
    const googleObj = (window as any).google;
    if (googleObj && googleObj.accounts && googleObj.accounts.id) {
      // Reinitialize to ensure the client_id is set
      googleObj.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredentialResponse,
      });
      googleObj.accounts.id.prompt();
    } else {
      console.error("Google Identity Services not loaded.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950">
      <main className="container mx-auto px-4 py-16 flex flex-col items-center">
        {/* Hero Section */}
        <div className="text-center space-y-6 max-w-3xl mx-auto mb-20">
          <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
            Welcome to Better Me
          </h1>
          <p className="text-xl md:text-2xl text-gray-400">
            Track your habits and build a better version of yourself, one day at a time.
          </p>
          <div className="flex flex-col items-center space-y-4">
            {/* "Get Started" Button */}
            <Button size="lg" className="group" onClick={() => navigate("/tracker")}>
              Get Started
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            {/* Custom Google Sign-In Button */}
            <Button size="lg" className="group" onClick={handleGoogleSignIn}>
              Sign in with Google
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
        {/* Feature Cards */}
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
        {/* Footer Component */}
        <Footer />
      </main>
    </div>
  );
};

export default LandingPage;
