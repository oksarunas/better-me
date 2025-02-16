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
  NutIcon as Vitamins,
  Droplets,
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
import { Label } from '../ui/label';

import { fetchHabitsApi, updateHabitApi, fetchWeeklyHabitsApi, fetchAnalyticsApi } from "../../api"
import { Habit as HabitType, WeeklyData } from "../../types"
import { useAuth } from "../../contexts/AuthContext"

const listItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export default function HabitTracker() {
  const { logout } = useAuth()
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date())
  const [progress, setProgress] = React.useState(50)
  const [filter, setFilter] = React.useState("all")
  const [theme, setTheme] = React.useState("dark")
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [backendHabits, setBackendHabits] = React.useState<HabitType[]>([])
  const [weeklyData, setWeeklyData] = React.useState<WeeklyData[]>([])

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const date = selectedDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]
        
        const [habitsData, weeklyDataResponse, analyticsDataResponse] = await Promise.all([
          fetchHabitsApi(date),
          fetchWeeklyHabitsApi(),
          fetchAnalyticsApi(
            new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
            date
          ),
        ])
        
        setBackendHabits(habitsData)
        setWeeklyData(weeklyDataResponse)
        
        const completedCount = habitsData.filter((h: HabitType) => h.status).length
        setProgress(Math.round((completedCount / habitsData.length) * 100))
        
      } catch (err) {
        console.error("Error fetching data:", err)
        setError("Failed to load data. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedDate])

  const handleToggleHabit = async (habitId: number, newStatus: boolean) => {
    try {
      await updateHabitApi(habitId, { status: newStatus })
      setBackendHabits(habits => habits.map(h => 
        h.id === habitId ? { ...h, status: newStatus } : h
      ))
    } catch (err) {
      console.error("Error updating habit:", err)
    }
  }

  const uiHabits = backendHabits.map(habit => ({
    icon: getHabitIcon(habit.category),
    label: habit.habit,
    category: habit.category || "Uncategorized",
    streak: habit.streak,
    goal: 30,
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

  const achievements = [
    { icon: Trophy, label: "30 Day Streak", description: "Complete all habits for 30 days" },
    { icon: Flame, label: "Perfect Week", description: "100% completion for 7 days" },
  ]

  const filteredHabits = uiHabits.filter(
    (habit) => filter === "all" || habit.category.toLowerCase() === filter.toLowerCase(),
  )

  const chartData = [
    { name: "Week 1", progress: 30 },
    { name: "Week 2", progress: 45 },
    { name: "Week 3", progress: 55 },
    { name: "Week 4", progress: 50 },
  ]

  const addHabit = (newHabit: Omit<HabitType, 'id' | 'streak'>) => {
    setBackendHabits([...backendHabits, { ...newHabit, streak: 0, id: Math.floor(Math.random() * 1000) }])
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
                          status: false, // Initial status as not completed
                          goal: 1, // Default goal of 1, you might want to add a field for this // Default icon, you might want to add icon selection
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
                <Badge variant="secondary">4 of 8 Completed</Badge>
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
                          {habit.streak}/{habit.goal}
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
              {achievements.map((achievement) => (
                <div
                  key={achievement.label}
                  className={`flex items-center gap-4 rounded-lg border ${
                    theme === "dark" ? "border-slate-700" : "border-slate-200"
                  } p-4`}
                >
                  <div className={`rounded-full p-2 ${theme === "dark" ? "bg-slate-700" : "bg-slate-100"}`}>
                    <achievement.icon
                      className={`h-5 w-5 ${theme === "dark" ? "text-yellow-500" : "text-yellow-600"}`}
                    />
                  </div>
                  <div>
                    <h3 className={`font-medium ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                      {achievement.label}
                    </h3>
                    <p className={theme === "dark" ? "text-slate-400" : "text-slate-500"}>{achievement.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className={theme === "dark" ? "bg-slate-800/50 border-slate-700" : "bg-white"}>
            <CardHeader>
              <CardTitle className={theme === "dark" ? "text-white" : "text-slate-900"}>Monthly Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className={theme === "dark" ? "text-white" : "text-slate-900"}
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
                  <p className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>7 Days</p>
                </div>
              </CardContent>
            </Card>
            <Card className={theme === "dark" ? "bg-slate-800/50 border-slate-700" : "bg-white"}>
              <CardHeader className="pb-2">
                <CardTitle className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                  Today's Progress
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
