import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

type Activity = { type: string; minutes: number; points: number };

function loadActivities() {
  return getJson<{ activities: Activity[] }>('/api/activities').then(({ activities }) => activities);
}

export default function Activities() {
  return (
    <CapabilityCard<Activity>
      title="Activities"
      description="Track student activity minutes and points."
      loadItems={loadActivities}
      emptyMessage="No activities yet."
      renderItem={(activity) => `${activity.type} · ${activity.minutes} minutes · ${activity.points} points`}
    />
  );
}
