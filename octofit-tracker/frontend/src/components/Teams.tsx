import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

type Team = { name: string; mascot?: string; members?: string[] };

function loadTeams() {
  return getJson<{ teams: Team[] }>('/api/teams').then(({ teams }) => teams);
}

export default function Teams() {
  return (
    <CapabilityCard<Team>
      title="Teams"
      description="Manage teams and members."
      loadItems={loadTeams}
      emptyMessage="No teams yet."
      renderItem={(team) => `${team.name} · ${team.mascot ?? 'Mascot not set'} · ${team.members?.length ?? 0} members`}
    />
  );
}
