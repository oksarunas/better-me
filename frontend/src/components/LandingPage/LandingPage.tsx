import { ArrowRight, CheckCircle, LineChart, Zap } from 'lucide-react';
import { Button } from "../../components/ui/Button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/Card";

const LandingPage = () => {
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
          <Button size="lg" className="group">
            Get Started
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
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