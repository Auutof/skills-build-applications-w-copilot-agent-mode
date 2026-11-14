import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };

function loadLeaderboard() {
  return getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard').then(({ leaderboard }) => leaderboard);
}

export default function Leaderboard() {
  return (
    <CapabilityCard<LeaderboardEntry>
      title="Leaderboard"
      description="Compare team point totals."
      loadItems={loadLeaderboard}
      emptyMessage="No leaderboard scores yet."
      renderItem={(entry) => `#${entry.rank} ${entry.teamName} · ${entry.totalPoints} points`}
    />
  );
}
