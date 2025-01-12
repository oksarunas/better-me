import { CalendarIcon, CheckCircle2Icon, XCircleIcon } from 'lucide-react'
import { Button } from "../ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card"
import { Progress } from "../ui/Progress"
import { cn } from "../../lib/Utils"

export default function HabitTracker() {
  const habits = [
    { 
      category: "Health",
      items: [
        { name: "7 hours of sleep", streak: 2, completed: true },
        { name: "Workout", streak: 0, completed: false },
        { name: "Vitamins", streak: 0, completed: false },
      ],
    },
    {
      category: "Productivity",
      items: [
        { name: "Code", streak: 8, completed: true },
        { name: "Read", streak: 0, completed: false },
      ],
    },
    {
      category: "Lifestyle",
      items: [
        { name: "Breakfast", streak: 2, completed: true },
        { name: "Creatine", streak: 0, completed: false },
        { name: "No drink", streak: 1, completed: true },
      ],
    },
  ]

  const totalHabits = habits.reduce((acc, category) => acc + category.items.length, 0)
  const completedHabits = habits.reduce(
    (acc, category) => acc + category.items.filter(item => item.completed).length,
    0
  )
  const progress = (completedHabits / totalHabits) * 100

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="space-y-6">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold">My Habits</CardTitle>
            <Button variant="outline" size="sm" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              01/12/2025
            </Button>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{completedHabits} / {totalHabits} Habits Completed</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {habits.map((category, index) => (
            <div key={index} className="space-y-4">
              <h2 className="font-semibold text-lg">{category.category}</h2>
              <div className="grid gap-3">
                {category.items.map((habit, habitIndex) => (
                  <div
                    key={habitIndex}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {habit.completed ? (
                        <CheckCircle2Icon className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircleIcon className="h-5 w-5 text-gray-400" />
                      )}
                      <span>{habit.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-sm px-2 py-1 rounded",
                          habit.streak > 0
                            ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                        )}
                      >
                        🔥 {habit.streak} days
                      </span>
                      <span
                        className={cn(
                          "text-sm font-medium",
                          habit.completed
                            ? "text-green-600 dark:text-green-400"
                            : "text-gray-500"
                        )}
                      >
                        {habit.completed ? "Completed" : "Pending"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

