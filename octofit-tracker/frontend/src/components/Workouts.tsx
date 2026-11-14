import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = {
  title: string;
  focus?: string;
  minutes?: number;
  difficulty?: string;
  reason?: string;
};

export default function Workouts() {
  const userEmail = encodeURIComponent('mona@example.com');
  return (
    <CapabilityCard<WorkoutSuggestion>
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      endpoint={`/api/workouts/suggestions/${userEmail}`}
      resourceKey="suggestions"
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
