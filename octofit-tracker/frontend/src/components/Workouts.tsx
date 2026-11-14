import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

type WorkoutSuggestion = {
  title: string;
  focus?: string;
  minutes?: number;
  difficulty?: string;
  reason?: string;
};

function loadWorkoutSuggestions() {
  const userEmail = encodeURIComponent('mona@example.com');
  return getJson<{ suggestions: WorkoutSuggestion[] }>(`/api/workouts/suggestions/${userEmail}`)
    .then(({ suggestions }) => suggestions);
}

export default function Workouts() {
  return (
    <CapabilityCard<WorkoutSuggestion>
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      loadItems={loadWorkoutSuggestions}
      emptyMessage="No workout suggestions yet."
      renderItem={(workout) => (
        <>
          <strong>{workout.title}</strong>
          {workout.focus && <span> · {workout.focus}</span>}
          {workout.minutes !== undefined && <span> · {workout.minutes} minutes</span>}
          {workout.difficulty && <span> · {workout.difficulty}</span>}
          {workout.reason && <p className="mb-0">{workout.reason}</p>}
        </>
      )}
    />
  );
}
