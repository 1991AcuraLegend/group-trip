'use client';

import { useRouter } from 'next/navigation';
import type { MemberRole } from '@prisma/client';
import { useMembers, useRemoveMember, useLeaveTrip, useUpdateMemberRole, type MemberWithUser } from '@/hooks/useMembers';

type Props = {
  tripId: string;
  currentUserId: string;
  isOwner: boolean;
};

function initials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function roleLabel(role: MemberRole) {
  if (role === 'OWNER') return 'Owner';
  if (role === 'VIEWER') return 'View Only';
  return 'View and Edit';
}

function roleBadgeClass(role: MemberRole) {
  if (role === 'OWNER') return 'bg-ocean-100 text-ocean-700';
  if (role === 'VIEWER') return 'bg-amber-100 text-amber-700';
  return 'bg-sand-100 text-sand-600';
}

export function MemberList({ tripId, currentUserId, isOwner }: Props) {
  const router = useRouter();
  const { data: members, isLoading } = useMembers(tripId);
  const removeMember = useRemoveMember(tripId);
  const leaveTrip = useLeaveTrip(tripId);
  const updateRole = useUpdateMemberRole(tripId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  async function handleRemove(member: MemberWithUser) {
    if (!window.confirm(`Remove ${member.user.name} from this trip?`)) return;
    await removeMember.mutateAsync(member.id);
  }

  async function handleLeave(member: MemberWithUser) {
    if (!window.confirm('Leave this trip? You will lose access.')) return;
    await leaveTrip.mutateAsync(member.id);
    router.push('/dashboard');
  }

  async function handleRoleChange(member: MemberWithUser, role: MemberRole) {
    await updateRole.mutateAsync({ memberId: member.id, role });
  }

  return (
    <ul className="flex flex-col divide-y divide-sand-100">
      {members?.map((member) => {
        const isSelf = member.userId === currentUserId;
        const isThisOwner = member.role === 'OWNER';
        return (
          <li key={member.id} className="flex items-center gap-3 py-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ocean-100 text-xs font-bold text-ocean-700">
              {initials(member.user.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {member.user.name}
                {isSelf && <span className="ml-1 text-xs text-gray-400">(you)</span>}
              </p>
              <p className="text-xs text-gray-500 truncate">{member.user.email}</p>
            </div>

            {/* Role — dropdown for owner editing non-owner members, badge otherwise */}
            {isOwner && !isThisOwner ? (
              <select
                value={member.role}
                onChange={(e) => handleRoleChange(member, e.target.value as MemberRole)}
                disabled={updateRole.isPending}
                className="shrink-0 rounded-md border border-sand-300 bg-white px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-ocean-400 disabled:opacity-50"
              >
                <option value="COLLABORATOR">View and Edit</option>
                <option value="VIEWER">View Only</option>
              </select>
            ) : (
              <span
                className={[
                  'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                  roleBadgeClass(member.role),
                ].join(' ')}
              >
                {roleLabel(member.role)}
              </span>
            )}

            {/* Remove button (owner removing others) */}
            {isOwner && !isSelf && (
              <button
                onClick={() => handleRemove(member)}
                disabled={removeMember.isPending}
                className="shrink-0 rounded p-1 text-gray-400 hover:text-coral-600 hover:bg-coral-50 transition-colors disabled:opacity-50"
                title="Remove member"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            {/* Leave button (non-owner viewing their own row) */}
            {!isOwner && isSelf && (
              <button
                onClick={() => handleLeave(member)}
                disabled={leaveTrip.isPending}
                className="shrink-0 rounded px-2 py-1 text-xs text-gray-400 hover:text-coral-600 hover:bg-coral-50 transition-colors disabled:opacity-50 border border-gray-200 hover:border-coral-300"
                title="Leave trip"
              >
                Leave
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
