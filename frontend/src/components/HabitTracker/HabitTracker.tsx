"use client"

import * as React from "react"
import { Calendar } from "../ui/Calendar"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card"
import { Progress } from "../ui/Progress"
import { Checkbox } from "../ui/Checkbox"
import { Badge } from "../ui/Badge"
import {
  Moon,
  Sun,
  Dumbbell,
  Code,
  Coffee,
  Book,
  Trophy,
  Flame,
  Filter,
  Plus,
  Target,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "../ui/Button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { Input } from "../ui/Input"
import { mockAchievements } from '../Achievements/Achievements';
import { Label } from '../ui/label';
import { Achievement } from '../Achievements/types';

import { fetchHabitsApi, updateHabitApi, fetchWeeklyHabitsApi, fetchAnalyticsApi, createHabitApi } from "../../api"
import { Habit, WeeklyData, AnalyticsData } from "../../types" // Updated imports
import { useAuth } from "../../contexts/AuthContext"

const listItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export default function HabitTracker() {
  const { user } = useAuth()
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date())
  const [progress, setProgress] = React.useState(50)
  const [filter, setFilter] = React.useState("all")
  const [theme, setTheme] = React.useState("dark")
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [backendHabits, setBackendHabits] = React.useState<Habit[]>([])
  const [weeklyData, setWeeklyData] = React.useState<WeeklyData[]>([])
  const [analyticsData, setAnalyticsData] = React.useState<AnalyticsData | null>(null)

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const date = selectedDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]
        
        const [habitsData, weeklyDataResponse, analyticsDataResponse] = await Promise.all([
          fetchHabitsApi(date),
          fetchWeeklyHabitsApi(),
          fetchAnalyticsApi(30),
        ])
        
        setBackendHabits(habitsData)
        setWeeklyData(weeklyDataResponse)
        setAnalyticsData(analyticsDataResponse)
        
        const completedCount = habitsData.filter((h: Habit) => h.status).length
        setProgress(Math.round((completedCount / habitsData.length) * 100) || 0) // Handle empty habits case
        
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedDate])

  const handleToggleHabit = async (habitId: number, newStatus: boolean) => {
    try {
      const response = await updateHabitApi(habitId, { status: newStatus })
      setBackendHabits(habits => {
        const updatedHabits = habits.map(h => 
          h.id === habitId ? { 
            ...h, 
            status: newStatus,
            streak: response.streak
          } : h
        );
        const completedCount = updatedHabits.filter(h => h.status).length;
        setProgress(Math.round((completedCount / updatedHabits.length) * 100) || 0);
        return updatedHabits;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update habit. Please try again.")
    }
  }

  const uiHabits = backendHabits.map(habit => ({
    icon: getHabitIcon(habit.category),
    label: habit.habit,
    category: habit.category || "Uncategorized",
    streak: habit.streak,
    id: habit.id,
    status: habit.status
  }))

  function getHabitIcon(category?: string) {
    switch (category?.toLowerCase()) {
      case "sleep": return Moon
      case "health": return Coffee
      case "exercise": return Dumbbell
      case "work": return Code
      case "learning": return Book
      default: return Coffee
    }
  }

  const achievements = mockAchievements;

  const filteredHabits = uiHabits.filter(
    (habit) => filter === "all" || habit.category.toLowerCase() === filter.toLowerCase(),
  )

  const chartData = [
    { name: "Week 1", progress: 30 },
    { name: "Week 2", progress: 45 },
    { name: "Week 3", progress: 55 },
    { name: "Week 4", progress: 50 },
  ]

  const addHabit = async (newHabit: Omit<Habit, 'id' | 'streak'>) => {
    try {
        const createdHabit = await createHabitApi(newHabit);
        setBackendHabits([...backendHabits, createdHabit]);
    } catch (error) {
        console.error('Failed to add habit:', error);
        setError('Failed to add habit. Please try again.');
    }
};

  const getHabitCompletionCount = (habit: string) => {
    if (!analyticsData?.stackedData?.[habit]) return 0;
    return analyticsData.stackedData[habit].reduce((sum: number, count: number) => sum + count, 0);
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        theme === "dark" ? "bg-gradient-to-b from-slate-900 to-slate-800" : "bg-gradient-to-b from-slate-100 to-white"
      } p-6`}
    >
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>HabitTracker</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-full"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card className={theme === "dark" ? "bg-slate-800/50 border-slate-700" : "bg-white"}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className={theme === "dark" ? "text-white" : "text-slate-900"}>Daily Checklist</CardTitle>
              <div className="flex items-center gap-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setFilter("all")}>All</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilter("health")}>Health</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilter("exercise")}>Exercise</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilter("work")}>Work</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Habit</DialogTitle>
                    </DialogHeader>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        const formData = new FormData(e.target as HTMLFormElement)
                        addHabit({
                          habit: formData.get("habitName") as string,
                          category: formData.get("category") as string,
                          status: false,
                          date: new Date().toISOString().split('T')[0], // Default to today
                          user_id: user?.id ? parseInt(user.id) : 1, // Use logged-in user or default to 1
                        })
                      }}
                    >
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="habitName" className="text-right">
                            Habit Name
                          </Label>
                          <Input id="habitName" name="habitName" className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="category" className="text-right">
                            Category
                          </Label>
                          <Input id="category" name="category" className="col-span-3" />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button type="submit">Add Habit</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
                <Badge variant="secondary">{progress}% Completed</Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : error ? (
                <div className="text-red-500 p-4 text-center">{error}</div>
              ) : (
                <AnimatePresence>
                  {filteredHabits.map((habit, i) => (
                    <motion.div
                      key={habit.label}
                      variants={listItemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      transition={{ delay: i * 0.1 }}
                      className={`flex items-center space-x-4 rounded-lg border ${
                        theme === "dark" ? "border-slate-700 hover:bg-slate-700/50" : "border-slate-200 hover:bg-slate-50"
                      } p-4 transition-colors`}
                    >
                      <Checkbox
                        id={`habit-${habit.id}`}
                        checked={habit.status}
                        onChange={(e) => handleToggleHabit(habit.id, e.target.checked)}
                        className={theme === "dark" ? "border-slate-700" : "border-slate-300"}
                      />
                      <div className="flex-1 space-y-1">
                        <label
                          htmlFor={`habit-${habit.id}`}
                          className={`text-sm font-medium leading-none ${
                            theme === "dark" ? "text-white" : "text-slate-900"
                          } cursor-pointer`}
                        >
                          {habit.label}
                        </label>
                        <div className="flex items-center gap-2">
                          <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                            {habit.category}
                          </p>
                          {habit.streak >= 5 && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Flame className="h-3 w-3" />
                              {habit.streak} day streak
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className={`h-4 w-4 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`} />
                        <span className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                          {getHabitCompletionCount(habit.label)}/30
                        </span>
                      </div>
                      <habit.icon className={`h-5 w-5 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </CardContent>
          </Card>

          <Card className={theme === "dark" ? "bg-slate-800/50 border-slate-700" : "bg-white"}>
            <CardHeader>
              <CardTitle className={theme === "dark" ? "text-white" : "text-slate-900"}>Achievements</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {mockAchievements.map((achievement: Achievement) => {
                const IconComponent = achievement.icon;
                return (
                  <div
                    key={achievement.title}
                    className={`flex items-center gap-4 rounded-lg border ${
                      theme === "dark" ? "border-slate-700" : "border-slate-200"
                    } p-4`}
                  >
                    <div className={`rounded-full p-2 ${theme === "dark" ? "bg-slate-700" : "bg-slate-100"}`}>
                      <IconComponent className={`h-5 w-5 ${theme === "dark" ? "text-yellow-500" : "text-yellow-600"}`} />
                    </div>
                    <div>
                      <h3 className={`font-medium ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                        {achievement.title}
                      </h3>
                      <p className={theme === "dark" ? "text-slate-400" : "text-slate-500"}>{achievement.description}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className={theme === "dark" ? "bg-slate-800/50 border-slate-700" : "bg-white"}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className={theme === "dark" ? "text-white" : "text-slate-900"}>Monthly Overview</CardTitle>
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                    {new Date().toLocaleTimeString('en-US', { 
                      hour12: false,
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  {selectedDate && 
                   new Date(selectedDate).toDateString() === new Date().toDateString() && (
                    <span className="text-green-500 text-sm">Today</span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className={theme === "dark" ? "text-white" : "text-slate-900"}
                modifiers={{
                  today: new Date(),
                  selected: selectedDate
                }}
                modifiersStyles={{
                  today: {
                    fontWeight: 'bold',
                    border: '2px solid #22c55e'
                  },
                  selected: {
                    backgroundColor: '#22c55e',
                    color: 'white',
                    borderRadius: '50%'
                  }
                }}
              />
            </CardContent>
          </Card>

          <Card className={theme === "dark" ? "bg-slate-800/50 border-slate-700" : "bg-white"}>
            <CardHeader>
              <CardTitle className={theme === "dark" ? "text-white" : "text-slate-900"}>Progress Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" stroke={theme === "dark" ? "#fff" : "#000"} />
                  <YAxis stroke={theme === "dark" ? "#fff" : "#000"} />
                  <Tooltip />
                  <Line type="monotone" dataKey="progress" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className={theme === "dark" ? "bg-slate-800/50 border-slate-700" : "bg-white"}>
              <CardHeader className="pb-2">
                <CardTitle className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                  Current Streak
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                  <p className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text Wslate-900"}`}>7 Days</p>
                </div>
              </CardContent>
            </Card>
            <Card className={theme === "dark" ? "bg-slate-800/50 border-slate-700" : "bg-white"}>
              <CardHeader className="pb-2">
                <CardTitle className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                  {selectedDate && new Date(selectedDate).toDateString() === new Date().toDateString()
                    ? "Today's Progress"
                    : `Progress for ${selectedDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>{progress}%</p>
                <Progress value={progress} className={`h-2 ${theme === "dark" ? "bg-slate-700" : "bg-slate-200"}`} />
              </CardContent>
            </Card>
            <Card className={theme === "dark" ? "bg-slate-800/50 border-slate-700" : "bg-white"}>
              <CardHeader className="pb-2">
                <CardTitle className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                  30-Day Avg
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>44%</p>
                <Progress value={44} className={`h-2 ${theme === "dark" ? "bg-slate-700" : "bg-slate-200"}`} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}