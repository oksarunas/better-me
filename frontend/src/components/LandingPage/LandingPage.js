import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "../ui/Button";
import { Card, CardContent } from "../ui/Card";
import { ArrowRight, CheckCircle, LineChart, Zap } from 'lucide-react';
import '../../styles/components/LandingPage.css';


const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-6">
        <Card className="max-w-2xl w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-6">
              <h1 className="text-4xl font-bold tracking-tighter">
                Welcome to Better Me
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                Track your habits and build a better version of yourself.
              </p>
              <Button asChild size="lg" className="gap-2">
                <Link to="/tracker">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium">Track daily habits</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Stay consistent with your goals
                </p>
              </div>
              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <LineChart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium">Monitor progress</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Watch your improvements over time
                </p>
              </div>
              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium">Stay motivated</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Build streaks and achieve more
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>© 2025 Better Me. All rights reserved.</p>
        <div className="mt-2 space-x-4">
          <Link to="https://twitter.com" className="hover:text-primary">
            Twitter
          </Link>
          <Link to="https://github.com" className="hover:text-primary">
            GitHub
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
