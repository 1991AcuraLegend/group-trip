'use client';

import { useMembers, useRemoveMember, type MemberWithUser } from '@/hooks/useMembers';

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

export function MemberList({ tripId, currentUserId, isOwner }: Props) {
  const { data: members, isLoading } = useMembers(tripId);
  const removeMember = useRemoveMember(tripId);

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

  return (
    <ul className="flex flex-col divide-y divide-sand-100">
      {members?.map((member) => (
        <li key={member.id} className="flex items-center gap-3 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ocean-100 text-xs font-bold text-ocean-700">
            {initials(member.user.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{member.user.name}</p>
            <p className="text-xs text-gray-500 truncate">{member.user.email}</p>
          </div>
          <span
            className={[
              'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
              member.role === 'OWNER'
                ? 'bg-ocean-100 text-ocean-700'
                : 'bg-sand-100 text-sand-600',
            ].join(' ')}
          >
            {member.role === 'OWNER' ? 'Owner' : 'Collaborator'}
          </span>
          {isOwner && member.userId !== currentUserId && (
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
        </li>
      ))}
    </ul>
  );
}
