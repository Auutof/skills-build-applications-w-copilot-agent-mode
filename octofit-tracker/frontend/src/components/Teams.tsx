import { CapabilityCard } from './CapabilityCard.js';

type Team = { name: string; mascot?: string; members?: string[] };

export default function Teams() {
  return (
    <CapabilityCard<Team>
      title="Teams"
      description="Manage teams and members."
      endpoint="/api/teams"
      resourceKey="teams"
      emptyMessage="No teams yet."
      renderItem={(team) => `${team.name} · ${team.mascot ?? 'Mascot not set'} · ${team.members?.length ?? 0} members`}
    />
  );
}
