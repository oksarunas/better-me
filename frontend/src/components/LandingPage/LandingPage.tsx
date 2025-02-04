import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle, LineChart, Zap } from 'lucide-react';
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

// If you have a function to call your backend, e.g. `googleSignInApi`:
import { googleSignInApi } from '../../api'; // <-- Adjust import path as needed

const CLIENT_ID = "1082509608270-drlp7f9h7hr70q16mfv9q3cv7pqk6jqi.apps.googleusercontent.com"; 

const LandingPage = () => {
  const navigate = useNavigate();

  // 1) Define the callback for Google Identity Services
  useEffect(() => {
    // Expose the callback so Google can call it
    (window as any).handleCredentialResponse = async (response: any) => {
      try {
        const idToken = response.credential;  // The Google ID token
        console.log("Google ID token:", idToken);

        // 2) Send the ID token to your backend
        const result = await googleSignInApi(idToken);
        console.log("Server response:", result);

        // 3) Now you have user info or a JWT from your backend
        // You could store result in context or localStorage.
        // For simplicity, let's just log and navigate to the tracker:
        navigate("/tracker");
      } catch (err) {
        console.error("Google sign-in error:", err);
      }
    };
  }, [navigate]);

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

          {/* Existing "Get Started" button */}
          <Button size="lg" className="group" onClick={() => navigate("/tracker")}>
            Get Started
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>

          {/* Google Sign-In Button */}
          <div
            id="g_id_onload"
            data-client_id={CLIENT_ID}
            data-callback="handleCredentialResponse" // calls our window.handleCredentialResponse
          ></div>
          <div
            className="g_id_signin"
            data-type="standard"
            data-size="large"
            data-theme="outline"
            data-text="sign_in_with"
            data-shape="rectangular"
            data-logo_alignment="left"
          ></div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8 w-full max-w-5xl">
          <Card className="p-6 bg-gray-900/50 backdrop-blur border-gray-800 hover:border-gray-700 transition-all hover:-translate-y-1">
            <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-6">
              <CheckCircle className="h-6 w-6 text-emerald-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Track daily habits</h3>
            <p className="text-gray-400">Stay consistent with your goals through our intuitive tracking system.</p>
          </Card>
          <Card className="p-6 bg-gray-900/50 backdrop-blur border-gray-800 hover:border-gray-700 transition-all hover:-translate-y-1">
            <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-6">
              <LineChart className="h-6 w-6 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Monitor progress</h3>
            <p className="text-gray-400">Watch your improvements over time with detailed analytics and insights.</p>
          </Card>
          <Card className="p-6 bg-gray-900/50 backdrop-blur border-gray-800 hover:border-gray-700 transition-all hover:-translate-y-1">
            <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-6">
              <Zap className="h-6 w-6 text-purple-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Stay motivated</h3>
            <p className="text-gray-400">Build streaks and achieve more with rewards and milestone celebrations.</p>
          </Card>
        </div>

        {/* Footer */}
        <footer className="mt-32 text-center space-y-4">
          <p className="text-gray-500">© 2025 Better Me. All rights reserved.</p>
          <div className="flex items-center justify-center space-x-4">
            <a
              href="https://twitter.com"
              className="text-gray-500 hover:text-gray-400 transition-colors"
            >
              Twitter
            </a>
            <a
              href="https://github.com"
              className="text-gray-500 hover:text-gray-400 transition-colors"
            >
              GitHub
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default LandingPage;
