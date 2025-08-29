import React, { useState } from 'react';
import Calendar from 'react-calendar';
import Papa from 'papaparse';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import 'react-calendar/dist/Calendar.css';
import './App.css';

const tips = [
  "Stay hydrated throughout your workout.",
  "Focus on form, not just weight.",
  "Consistency beats intensity.",
  "Warm up before heavy lifts.",
  "Track your progress weekly.",
  "Don't skip your cool-down stretches.",
  "Fuel your body with good nutrition.",
  "Listen to your body and rest when needed."
];

const weeklyPlan = {
  Day1: {
    title: 'Chest + Triceps + Cardio + Core',
    warmup: [
      'Arm circles & shoulder rolls: 2 sets x 10 each direction',
      'Incline treadmill walk: 5 minutes at 3.5 mph, 5% incline',
      'Dynamic chest stretches: 10 reps each arm'
    ],
    exercises: [
      { name: 'Dumbbell Bench Press', sets: 4, reps: '8-10', id: 'db-bench' },
      { name: 'Incline Dumbbell Press', sets: 3, reps: '10-12', id: 'incline-press' },
      { name: 'Chest Flyes (Machine)', sets: 3, reps: '12-15', id: 'flyes-machine' },
      { name: 'Cable Tricep Pushdowns', sets: 3, reps: '10-12', id: 'pushdowns' },
      { name: 'Close-Grip Push-ups', sets: 3, reps: '6-10', id: 'cg-pushups' },
      { name: 'Cable Overhead Extension', sets: 3, reps: '12-15', id: 'overhead-ext' }
    ],
    core: [
      { name: 'Plank Hold', sets: 3, reps: '30-60 sec', id: 'core-plank' },
      { name: 'Bicycle Crunches', sets: 3, reps: '20 each side', id: 'core-bicycle' },
      { name: 'Dead Bug', sets: 3, reps: '10 each side', id: 'core-deadbug' },
      { name: 'Russian Twists', sets: 3, reps: '30 total', id: 'core-twists' }
    ],
    cardio: {
      type: 'Treadmill HIIT',
      details: '5 min warm-up (4.0 mph), 8 rounds: 30s sprint (7.5 mph) + 90s recovery (4.5 mph), 5 min cool-down (3.5 mph)',
      id: 'cardio-Day1'
    },
    nutrition: {
      pre: '1 scoop whey protein + 1 small banana, 500ml water',
      post: '1 scoop whey protein, 500ml water'
    },
    cooldown: [
      'Chest and tricep stretches',
      'Deep breathing exercises'
    ]
  },
  Day2: {
    title: 'Back + Biceps + Cardio + Core',
    warmup: [
      'Cat-cow stretches: 10 reps',
      'Seated rowing machine: 5 minutes moderate pace',
      'Scapular wall slides: 15 reps'
    ],
    exercises: [
      { name: 'Lat Pulldown', sets: 4, reps: '8-10', id: 'lat-pulldown' },
      { name: 'Chest-Supported Row', sets: 4, reps: '10-12', id: 'chest-row' },
      { name: 'Single-Arm Dumbbell Row', sets: 3, reps: '10-12', id: 'db-row' },
      { name: 'Face Pulls', sets: 3, reps: '15-20', id: 'face-pulls' },
      { name: 'Dumbbell Bicep Curls', sets: 3, reps: '12-15', id: 'db-curl' },
      { name: 'Hammer Curls', sets: 3, reps: '12-15', id: 'hammer-curl' }
    ],
    core: [
      { name: 'Side Plank', sets: 3, reps: '20-30 sec each side', id: 'core-sideplank' },
      { name: 'Mountain Climbers', sets: 3, reps: '20 total', id: 'core-mountain' },
      { name: 'Reverse Crunches', sets: 3, reps: '15', id: 'core-reverse' },
      { name: 'Standing Oblique Crunches', sets: 3, reps: '15 each side', id: 'core-oblique' }
    ],
    cardio: {
      type: 'Cycling HIIT',
      details: '5 min warm-up (moderate), 6 rounds: 45s high + 75s recovery, 5 min cool-down',
      id: 'cardio-Day2'
    },
    nutrition: {
      pre: '1 scoop whey protein + 1 small banana',
      post: '1 scoop whey protein'
    },
    cooldown: [
      'Back and bicep stretches',
      'Gentle neck mobility'
    ]
  },
  Day3: {
    title: 'Legs + Cardio + Core',
    warmup: [
      'Leg swings: 10 each direction, each leg',
      'Bodyweight squats: 15 reps',
      'Walking lunges: 10 each leg',
      'Calf raises: 15 reps'
    ],
    exercises: [
      { name: 'Goblet Squats', sets: 4, reps: '10-12', id: 'goblet-squats' },
      { name: 'Leg Press', sets: 4, reps: '12-15', id: 'leg-press' },
      { name: 'Romanian Deadlifts', sets: 4, reps: '10-12', id: 'rdl' },
      { name: 'Walking Lunges', sets: 3, reps: '12 each leg', id: 'lunges' },
      { name: 'Leg Curls', sets: 3, reps: '12-15', id: 'leg-curls' },
      { name: 'Calf Raises', sets: 4, reps: '15-20', id: 'calf-raises' }
    ],
    core: [
      { name: 'Leg Raises', sets: 3, reps: '12-15', id: 'core-legraises' },
      { name: 'Flutter Kicks', sets: 3, reps: '20 total', id: 'core-flutter' },
      { name: 'Plank to Pike', sets: 3, reps: '10', id: 'core-pike' },
      { name: 'Cross-body Crunches', sets: 3, reps: '15 each side', id: 'core-crossbody' }
    ],
    cardio: {
      type: 'Treadmill Steady State',
      details: '3 min warm-up (3.5 mph), 15 min at 4.5-5.0 mph, 2 min cool-down (3.0 mph)',
      id: 'cardio-Day3'
    },
    nutrition: {
      pre: '1 scoop whey protein + 1 small banana',
      post: '1 scoop whey protein'
    },
    cooldown: [
      'Quad, hamstring, and calf stretches'
    ]
  },
  Day4: {
    title: 'Shoulders + Cardio + Core',
    warmup: [
      'Arm circles: 15 each direction',
      'Band pull-aparts: 15 reps',
      'Shoulder shrugs: 15 reps',
      'Light cardio: 5 minutes stationary bike'
    ],
    exercises: [
      { name: 'Machine Shoulder Press', sets: 4, reps: '8-10', id: 'shoulder-press' },
      { name: 'Lateral Raises', sets: 4, reps: '12-15', id: 'lateral-raises' },
      { name: 'Front Raises', sets: 3, reps: '12-15', id: 'front-raises' },
      { name: 'Rear Delt Flyes', sets: 4, reps: '15-20', id: 'rear-flyes' },
      { name: 'Cable Upright Rows', sets: 3, reps: '12-15', id: 'upright-rows' },
      { name: 'Dumbbell Shrugs', sets: 3, reps: '15-20', id: 'shrugs' }
    ],
    core: [
      { name: 'Hollow Body Hold', sets: 3, reps: '20-30 sec', id: 'core-hollow' },
      { name: 'V-Ups', sets: 3, reps: '12-15', id: 'core-vups' },
      { name: 'Side Crunches', sets: 3, reps: '15 each side', id: 'core-sidecrunch' },
      { name: 'Plank Shoulder Taps', sets: 3, reps: '20 total', id: 'core-shouldertap' }
    ],
    cardio: {
      type: 'Rowing Machine HIIT',
      details: '5 min warm-up, 8 rounds: 20s all-out + 40s recovery, 5 min cool-down',
      id: 'cardio-Day4'
    },
    nutrition: {
      pre: '1 scoop whey protein + 1 small banana',
      post: '1 scoop whey protein'
    },
    cooldown: [
      'Shoulder and neck stretches (gentle)'
    ]
  },
  Day5: {
    title: 'Active Recovery',
    warmup: [
      'Light walking outdoors (30-45 minutes) or gentle yoga/stretching (20-30 minutes)'
    ],
    exercises: [
      { name: 'Chin Tucks', sets: 3, reps: '10 (5 sec holds)', id: 'chin-tucks' },
      { name: 'Wall Angels', sets: 3, reps: '15', id: 'wall-angels' },
      { name: 'Cat-Cow Stretches', sets: 2, reps: '10', id: 'cat-cow' },
      { name: 'Doorway Chest Stretch', sets: 3, reps: '30 sec hold', id: 'doorway' },
      { name: 'Neck Side Stretches', sets: 2, reps: '15 sec each side', id: 'neck-stretch' }
    ],
    core: [],
    cardio: {
      type: 'Light walking, yoga, or swimming',
      details: '30-60 min light activity, posture work, and mobility focus',
      id: 'cardio-Day5'
    },
    nutrition: {
      pre: 'Hydrate well, anti-inflammatory foods',
      post: 'Hydrate well, anti-inflammatory foods'
    },
    cooldown: [
      'Mobility work, deep breathing'
    ]
  },
  Day6: {
    title: 'Arms + Cardio + Core',
    warmup: [
      'Arm swings: 10 each direction',
      'Wrist circles: 10 each direction',
      'Light rowing: 5 minutes'
    ],
    exercises: [
      { name: 'Barbell Curls', sets: 4, reps: '10-12', id: 'barbell-curls' },
      { name: 'Cable Tricep Pushdowns', sets: 4, reps: '10-12', id: 'cable-pushdowns' },
      { name: 'Preacher Curls', sets: 3, reps: '12-15', id: 'preacher-curls' },
      { name: 'Cable Overhead Extension', sets: 3, reps: '12-15', id: 'overhead-ext' },
      { name: 'Cable Hammer Curls', sets: 3, reps: '15-20', id: 'cable-hammer' },
      { name: 'Diamond Push-ups', sets: 3, reps: '6-12', id: 'diamond-pushups' }
    ],
    core: [
      { name: 'Hanging Knee Raises', sets: 3, reps: '8-12', id: 'core-hangknees' },
      { name: 'Oblique Crunches', sets: 3, reps: '15 each side', id: 'core-oblique' },
      { name: 'Plank Variations', sets: 3, reps: '30-45 sec', id: 'core-plankvar' },
      { name: 'Bicycle Crunches', sets: 3, reps: '20 each side', id: 'core-bicycle' }
    ],
    cardio: {
      type: 'Treadmill Fat Burn',
      details: '5 min warm-up (3.5 mph), 15 min at 4.0-4.5 mph, 2-3% incline, 5 min cool-down (3.0 mph)',
      id: 'cardio-Day6'
    },
    nutrition: {
      pre: '1 scoop whey protein + 1 small banana',
      post: '1 scoop whey protein'
    },
    cooldown: [
      'Arm and forearm stretches'
    ]
  },
  Day7: {
    title: 'Full Body + Cardio + Core',
    warmup: [
      'Dynamic full-body movements: 5 minutes',
      'Light cardio: 5 minutes'
    ],
    exercises: [
      { name: 'Dumbbell Thrusters', sets: 3, reps: '45 sec work', id: 'thrusters' },
      { name: 'Bent-over Rows', sets: 3, reps: '45 sec work', id: 'bent-rows' },
      { name: 'Squat to Press', sets: 3, reps: '45 sec work', id: 'squat-press' },
      { name: 'Push-up to T', sets: 3, reps: '45 sec work', id: 'pushup-t' },
      { name: 'Reverse Lunges', sets: 3, reps: '45 sec work', id: 'rev-lunges' }
    ],
    core: [
      { name: 'Turkish Get-ups', sets: 3, reps: '5 each side', id: 'core-turkish' },
      { name: 'Dead Bug', sets: 3, reps: '10 each side', id: 'core-deadbug' },
      { name: 'Bear Crawl', sets: 3, reps: '10 steps forward/back', id: 'core-bearcrawl' }
    ],
    cardio: {
      type: 'Choice: cycling, treadmill, or rowing',
      details: '15 min steady-state or intervals after circuit',
      id: 'cardio-Day7'
    },
    nutrition: {
      pre: '1 scoop whey protein + 1 small banana',
      post: '1 scoop whey protein'
    },
    cooldown: [
      'Full body stretching routine',
      'Deep breathing exercises'
    ]
  }
};

const dayNames = Object.keys(weeklyPlan);

function App() {
  const [selectedDay, setSelectedDay] = useState(dayNames[0]);
  const [weights, setWeights] = useState({});
  const [notes, setNotes] = useState({});
  const [completed, setCompleted] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tip, setTip] = useState(tips[Math.floor(Math.random() * tips.length)]);

  const handleWeightChange = (id, value) => {
    if (value === '' || (!isNaN(value) && Number(value) >= 0)) {
      setWeights(prev => ({ ...prev, [id]: value }));
    }
  };

  const handleNoteChange = (id, value) => {
    setNotes(prev => ({ ...prev, [id]: value }));
  };

  const toggleCompletion = (id, setIdx) => {
    const key = `${id}-${setIdx}`;
    setCompleted(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSingleCheckbox = (id) => {
    setCompleted(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const sendReminder = () => {
    if (window.Notification) {
      if (Notification.permission === 'granted') {
        new Notification('Time for your workout!');
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('Time for your workout!');
          }
        });
      }
    } else {
      alert('Notifications are not supported in your browser.');
    }
  };

  const exportCSV = () => {
    const data = [];
    dayNames.forEach(day => {
      const d = weeklyPlan[day];
      d.exercises.forEach(ex => {
        data.push({
          Day: day,
          Exercise: ex.name,
          Weight: weights[ex.id] || '',
          Notes: notes[ex.id] || '',
          Completed: Array.from({ length: ex.sets }).map((_, i) => completed[`${ex.id}-${i}`] ? '✔' : '').join(' ')
        });
      });
    });
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workout-progress.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getWeeklyStats = () => {
    let totalSets = 0;
    let completedSets = 0;
    let totalWeight = 0;
    let cardioDone = 0;

    Object.values(weeklyPlan).forEach(day => {
      day.exercises?.forEach(ex => {
        totalSets += ex.sets;
        for (let i = 0; i < ex.sets; i++) {
          if (completed[`${ex.id}-${i}`]) completedSets++;
          if (completed[`${ex.id}-${i}`] && weights[ex.id]) {
            totalWeight += Number(weights[ex.id]);
          }
        }
      });
      day.core?.forEach(ex => {
        for (let i = 0; i < ex.sets; i++) {
          totalSets++;
          if (completed[`${ex.id}-${i}`]) completedSets++;
        }
      });
      if (completed[day.cardio?.id]) cardioDone++;
    });

    return {
      totalSets,
      completedSets,
      totalWeight,
      cardioDone
    };
  };

  const weeklyStats = getWeeklyStats();
  const dayData = weeklyPlan[selectedDay];

  return (
    <div className="container">
      <h1 className="main-title">🏋️ Fitness Tracker Dashboard</h1>

      <div className="calendar-section">
        <Calendar onChange={setSelectedDate} value={selectedDate} />
        <button className="reminder-btn" onClick={sendReminder}>🔔 Set Workout Reminder</button>
      </div>

      <div className="tabs">
        {dayNames.map(day => (
          <button
            key={day}
            className={`tab-btn ${selectedDay === day ? 'active' : ''}`}
            onClick={() => setSelectedDay(day)}
          >
            {day}
          </button>
        ))}
      </div>

      <div className="card">
        <h2 className="section-title">{dayData.title}</h2>

        {/* Trainer Tip */}
        <div className="tip-card">
          <strong>💡 Trainer Tip:</strong> {tip}
          <button className="tip-btn" onClick={() => setTip(tips[Math.floor(Math.random() * tips.length)])}>New Tip</button>
        </div>

        {/* Warmup */}
        {dayData.warmup && dayData.warmup.length > 0 && (
          <div className="block">
            <h3>Warm-up</h3>
            <ul>
              {dayData.warmup.map((item, idx) => <li key={idx}>{item}</li>)}
            </ul>
          </div>
        )}

        {/* Exercises */}
        <div className="block">
          <h3>Strength Exercises</h3>
          <div className="exercise-grid">
            {dayData.exercises?.map(ex => (
              <div key={ex.id} className="exercise-card">
                <div>
                  <strong>{ex.name}</strong>
                  <div className="small-text">Sets: {ex.sets}, Reps: {ex.reps}</div>
                </div>
                <input
                  type="number"
                  placeholder="Weight (kg)"
                  min={0}
                  value={weights[ex.id] || ''}
                  onChange={e => handleWeightChange(ex.id, e.target.value)}
                />
                <div>
                  {[...Array(ex.sets)].map((_, idx) => (
                    <input
                      key={idx}
                      type="checkbox"
                      checked={completed[`${ex.id}-${idx}`] || false}
                      onChange={() => toggleCompletion(ex.id, idx)}
                    />
                  ))}
                </div>
                <textarea
                  value={notes[ex.id] || ''}
                  onChange={e => handleNoteChange(ex.id, e.target.value)}
                  placeholder="Add notes"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Core Work */}
        {dayData.core && dayData.core.length > 0 && (
          <div className="block">
            <h3>Core Work</h3>
            <ul>
              {dayData.core.map((core, idx) => (
                <li key={core.id}>{core.name} — {core.sets} sets x {core.reps}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Cardio */}
        {dayData.cardio && (
          <div className="block">
            <h3>Cardio</h3>
            <p><strong>{dayData.cardio.type}:</strong> {dayData.cardio.details}</p>
            <input
              type="checkbox"
              checked={completed[dayData.cardio.id] || false}
              onChange={() => toggleSingleCheckbox(dayData.cardio.id)}
            /> <span>Mark Cardio Complete</span>
          </div>
        )}

        {/* Nutrition */}
        {dayData.nutrition && (
          <div className="block">
            <h3>Pre-Workout Nutrition</h3>
            <p>{dayData.nutrition.pre}</p>
            <h3>Post-Workout Nutrition</h3>
            <p>{dayData.nutrition.post}</p>
          </div>
        )}

        {/* Cooldown */}
        {dayData.cooldown && dayData.cooldown.length > 0 && (
          <div className="block">
            <h3>Cool-down</h3>
            <ul>
              {dayData.cooldown.map((item, idx) => <li key={idx}>{item}</li>)}
            </ul>
          </div>
        )}
      </div>

      {/* Weekly Summary */}
      <div className="card">
        <h3>📅 Weekly Summary</h3>
        <ul>
          <li>Completed Sets: {weeklyStats.completedSets} / {weeklyStats.totalSets}</li>
          <li>Total Weight Lifted: {weeklyStats.totalWeight} kg</li>
          <li>Cardio Sessions Completed: {weeklyStats.cardioDone} / 7</li>
        </ul>
        <button className="export-btn" onClick={exportCSV}>⬇️ Export Progress (CSV)</button>
      </div>

      {/* Progress Chart */}
      <div className="card">
        <h3>📊 Weekly Progress (Chart)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={Object.entries(weights).map(([name, value]) => ({ name, kg: +value }))}
          >
            <XAxis dataKey="name" hide />
            <YAxis domain={[0, 'auto']} />
            <Tooltip />
            <Line type="monotone" dataKey="kg" stroke="#22c55e" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default App;