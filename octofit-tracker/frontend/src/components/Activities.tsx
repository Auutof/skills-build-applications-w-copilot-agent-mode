import { CapabilityCard } from './CapabilityCard.js';

type Activity = { type: string; minutes: number; points: number };

export default function Activities() {
  return (
    <CapabilityCard<Activity>
      title="Activities"
      description="Track student activity minutes and points."
      endpoint="/api/activities"
      resourceKey="activities"
      emptyMessage="No activities yet."
      renderItem={(activity) => `${activity.type} · ${activity.minutes} minutes · ${activity.points} points`}
    />
  );
}
