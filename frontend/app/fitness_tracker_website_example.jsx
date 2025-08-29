// Full 7-Day Fitness Tracker Website Implementation
// Includes all 7 days of workouts from the uploaded markdown plan.

import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function WorkoutTracker() {
  const [selectedDay, setSelectedDay] = useState(() => localStorage.getItem('selectedDay') || 'Day1');
  const [weights, setWeights] = useState(() => {
    const saved = localStorage.getItem('weights');
    return saved ? JSON.parse(saved) : {};
  });
  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem('notes');
    return saved ? JSON.parse(saved) : {};
  });
  const [completed, setCompleted] = useState(() => {
    const saved = localStorage.getItem('completed');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('selectedDay', selectedDay);
  }, [selectedDay]);

  useEffect(() => {
    localStorage.setItem('completed', JSON.stringify(completed));
  }, [completed]);

  useEffect(() => {
    localStorage.setItem('weights', JSON.stringify(weights));
  }, [weights]);

  useEffect(() => {
    localStorage.setItem('notes', JSON.stringify(notes));
  }, [notes]);

  const weeklyPlan = {
    Day1: {
      title: 'Chest + Triceps',
      exercises: [
        { name: 'Dumbbell Bench Press', sets: 4, reps: '8-10', id: 'db-bench' },
        { name: 'Incline Dumbbell Press', sets: 3, reps: '10-12', id: 'incline-press' },
        { name: 'Chest Flyes (Machine)', sets: 3, reps: '12-15', id: 'flyes' },
        { name: 'Cable Tricep Pushdowns', sets: 3, reps: '10-12', id: 'pushdowns' },
        { name: 'Close-Grip Push-ups', sets: 3, reps: '6-10', id: 'pushups' },
        { name: 'Cable Overhead Extension', sets: 3, reps: '12-15', id: 'overhead' }
      ]
    },
    Day2: {
      title: 'Back + Biceps',
      exercises: [
        { name: 'Lat Pulldown', sets: 4, reps: '8-10', id: 'lat-pulldown' },
        { name: 'Chest-Supported Row', sets: 4, reps: '10-12', id: 'supported-row' },
        { name: 'Single-Arm Dumbbell Row', sets: 3, reps: '10-12', id: 'db-row' },
        { name: 'Face Pulls', sets: 3, reps: '15-20', id: 'face-pulls' },
        { name: 'Dumbbell Bicep Curls', sets: 3, reps: '12-15', id: 'bicep-curls' },
        { name: 'Hammer Curls', sets: 3, reps: '12-15', id: 'hammer-curls' }
      ]
    },
    Day3: {
      title: 'Legs',
      exercises: [
        { name: 'Goblet Squats', sets: 4, reps: '10-12', id: 'goblet-squats' },
        { name: 'Leg Press', sets: 4, reps: '12-15', id: 'leg-press' },
        { name: 'Romanian Deadlifts', sets: 4, reps: '10-12', id: 'rdl' },
        { name: 'Walking Lunges', sets: 3, reps: '12 each leg', id: 'lunges' },
        { name: 'Leg Curls', sets: 3, reps: '12-15', id: 'leg-curls' },
        { name: 'Calf Raises', sets: 4, reps: '15-20', id: 'calf-raises' }
      ]
    },
    Day4: {
      title: 'Shoulders',
      exercises: [
        { name: 'Machine Shoulder Press', sets: 4, reps: '8-10', id: 'shoulder-press' },
        { name: 'Lateral Raises', sets: 4, reps: '12-15', id: 'lateral-raises' },
        { name: 'Front Raises', sets: 3, reps: '12-15', id: 'front-raises' },
        { name: 'Rear Delt Flyes', sets: 4, reps: '15-20', id: 'rear-flyes' },
        { name: 'Cable Upright Rows', sets: 3, reps: '12-15', id: 'upright-rows' },
        { name: 'Dumbbell Shrugs', sets: 3, reps: '15-20', id: 'shrugs' }
      ]
    },
    Day5: {
      title: 'Active Recovery',
      exercises: [
        { name: 'Chin Tucks', sets: 3, reps: '10 (5 sec holds)', id: 'chin-tucks' },
        { name: 'Wall Angels', sets: 3, reps: '15', id: 'wall-angels' },
        { name: 'Cat-Cow Stretches', sets: 2, reps: '10', id: 'cat-cow' },
        { name: 'Doorway Chest Stretch', sets: 3, reps: '30 sec hold', id: 'doorway' },
        { name: 'Neck Side Stretches', sets: 2, reps: '15 sec each side', id: 'neck-stretch' }
      ]
    },
    Day6: {
      title: 'Arms',
      exercises: [
        { name: 'Barbell Curls', sets: 4, reps: '10-12', id: 'barbell-curls' },
        { name: 'Cable Tricep Pushdowns', sets: 4, reps: '10-12', id: 'cable-pushdowns' },
        { name: 'Preacher Curls', sets: 3, reps: '12-15', id: 'preacher-curls' },
        { name: 'Cable Overhead Extension', sets: 3, reps: '12-15', id: 'overhead-ext' },
        { name: 'Cable Hammer Curls', sets: 3, reps: '15-20', id: 'cable-hammer' },
        { name: 'Diamond Push-ups', sets: 3, reps: '6-12', id: 'diamond-pushups' }
      ]
    },
    Day7: {
      title: 'Full Body',
      exercises: [
        { name: 'Dumbbell Thrusters', sets: 3, reps: '45 sec work', id: 'thrusters' },
        { name: 'Bent-over Rows', sets: 3, reps: '45 sec work', id: 'bent-rows' },
        { name: 'Squat to Press', sets: 3, reps: '45 sec work', id: 'squat-press' },
        { name: 'Push-up to T', sets: 3, reps: '45 sec work', id: 'pushup-t' },
        { name: 'Reverse Lunges', sets: 3, reps: '45 sec work', id: 'rev-lunges' }
      ]
    }
  };

  const handleWeightChange = (id, value) => {
    setWeights(prev => ({ ...prev, [id]: value }));
  };

  const handleNoteChange = (id, value) => {
    setNotes(prev => ({ ...prev, [id]: value }));
  };

  const toggleCompletion = (id, setIdx) => {
    const key = `${id}-${setIdx}`;
    setCompleted(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Helper to check if all sets for a day are completed
  const isDayCompleted = (day) => {
    return weeklyPlan[day].exercises.every(ex =>
      [...Array(ex.sets)].every((_, idx) => completed[`${ex.id}-${idx}`])
    );
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-4">💪 Gym Workout Tracker</h1>
      <Tabs value={selectedDay} onValueChange={setSelectedDay} className="mb-6">
        <TabsList className="flex flex-wrap gap-2 justify-center">
          {Object.keys(weeklyPlan).map(day => (
            <TabsTrigger key={day} value={day}>{day}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex justify-center gap-2 mb-4">
        {Object.keys(weeklyPlan).map(day => (
          <div
            key={day}
            className={`w-10 h-10 flex items-center justify-center rounded-full border
              ${isDayCompleted(day) ? 'bg-green-400 text-white' : 'bg-gray-100'}
              ${selectedDay === day ? 'ring-2 ring-blue-500' : ''}
              cursor-pointer`}
            onClick={() => setSelectedDay(day)}
            title={weeklyPlan[day].title}
          >
            {day.replace('Day', '')}
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <h2 className="text-xl font-semibold">{weeklyPlan[selectedDay].title}</h2>
          {weeklyPlan[selectedDay].exercises.map(ex => (
            <div key={ex.id} className="border p-4 rounded-xl bg-white shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <p className="font-semibold">{ex.name}</p>
                  <p className="text-sm text-gray-500">Sets: {ex.sets} | Reps: {ex.reps}</p>
                </div>
                <Input
                  placeholder="Weight (kg)"
                  type="number"
                  value={weights[ex.id] || ''}
                  onChange={e => handleWeightChange(ex.id, e.target.value)}
                  className="w-24"
                />
              </div>
              <div className="flex gap-2 mb-2">
                {[...Array(ex.sets)].map((_, idx) => (
                  <Checkbox
                    key={idx}
                    checked={completed[`${ex.id}-${idx}`] || false}
                    onCheckedChange={() => toggleCompletion(ex.id, idx)}
                  />
                ))}
              </div>
              <Textarea
                placeholder="Notes or comments"
                value={notes[ex.id] || ''}
                onChange={e => handleNoteChange(ex.id, e.target.value)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardContent className="p-4">
          <h3 className="text-lg font-bold mb-2">📈 Progress Chart (Sample)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={Object.entries(weights).map(([name, value], i) => ({ name, kg: +value }))}>
              <XAxis dataKey="name" hide />
              <YAxis domain={[0, 'auto']} />
              <Tooltip />
              <Line type="monotone" dataKey="kg" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
