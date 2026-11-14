import { Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function httpError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) throw httpError(400, 'Activity body must be an object');
  const { userId, teamId, type, minutes } = input;
  if (typeof userId !== 'string' || !Types.ObjectId.isValid(userId)) {
    throw httpError(400, 'A valid userId is required');
  }
  if (typeof teamId !== 'string' || !Types.ObjectId.isValid(teamId)) {
    throw httpError(400, 'A valid teamId is required');
  }
  if (typeof type !== 'string' || type.trim().length === 0) {
    throw httpError(400, 'Activity type is required');
  }
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    throw httpError(400, 'Activity minutes must be a positive number');
  }

  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user || !team) throw httpError(404, 'Activity user or team was not found');

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) throw httpError(400, 'Team body must be an object');
  const { name, mascot } = input;
  if (typeof name !== 'string' || name.trim().length === 0) {
    throw httpError(400, 'Team name is required');
  }
  if (typeof mascot !== 'string' || mascot.trim().length === 0) {
    throw httpError(400, 'Team mascot is required');
  }

  const members: string[] = [];
  if (input.members !== undefined) {
    if (!Array.isArray(input.members)) throw httpError(400, 'Team members must be an array of user IDs');
    for (const memberId of input.members) {
      if (typeof memberId !== 'string' || !Types.ObjectId.isValid(memberId)) {
        throw httpError(400, 'Team member IDs must be valid');
      }
      members.push(memberId);
    }
  }

  const uniqueMembers = [...new Set(members)];
  if (uniqueMembers.length > 0) {
    const memberCount = await User.countDocuments({ _id: { $in: uniqueMembers } });
    if (memberCount !== uniqueMembers.length) throw httpError(404, 'One or more team members were not found');
  }

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members: uniqueMembers });
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().select('name').lean(),
    Activity.aggregate<{ _id: Types.ObjectId; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const pointsByTeam = new Map(totals.map(({ _id, totalPoints }) => [_id.toString(), totalPoints]));
  return teams
    .map(({ _id, name }) => ({
      teamName: name,
      totalPoints: pointsByTeam.get(_id.toString()) ?? 0,
    }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) throw httpError(404, 'User was not found');

  const [workouts, recentActivity] = await Promise.all([
    Workout.find().lean(),
    Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean(),
  ]);
  const goalFocus = user.fitnessGoal.toLowerCase();
  const goalWorkouts = workouts.filter((workout) => workout.focus.toLowerCase() === goalFocus);
  if (goalWorkouts.length > 0) {
    const activityReason = recentActivity ? ` and recent ${recentActivity.type} activity` : '';
    return goalWorkouts.map((workout) => ({
      ...workout,
      reason: `Recommended for your ${user.fitnessGoal} goal${activityReason}.`,
    }));
  }

  if (!recentActivity) return [];
  const activityType = recentActivity.type.toLowerCase();
  const activityFocus = ['run', 'cycle', 'walk', 'swim'].includes(activityType) ? 'endurance' : activityType;
  return workouts
    .filter((workout) => workout.focus.toLowerCase() === activityFocus)
    .map((workout) => ({
      ...workout,
      reason: `Recommended based on your recent ${recentActivity.type} activity.`,
    }));
}

export { User };
