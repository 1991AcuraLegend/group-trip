'use client';

import { useState } from 'react';
import type { MemberRole } from '@prisma/client';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { MemberList } from './MemberList';
import { useShareInfo, useGenerateShareLink } from '@/hooks/useMembers';

type Props = {
  tripId: string;
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  isOwner: boolean;
};

const ROLE_OPTIONS: { value: MemberRole; label: string }[] = [
  { value: 'COLLABORATOR', label: 'View and Edit' },
  { value: 'VIEWER', label: 'View Only' },
];

function roleLabelFor(role: MemberRole) {
  return ROLE_OPTIONS.find((o) => o.value === role)?.label ?? role;
}

function CopyableLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="flex gap-2">
      <input
        readOnly
        value={url}
        className="flex-1 rounded-md border border-sand-300 bg-sand-50 px-3 py-2 text-sm text-sand-600 truncate focus:outline-none"
      />
      <Button size="sm" variant="secondary" onClick={handleCopy}>
        {copied ? 'Copied!' : 'Copy'}
      </Button>
    </div>
  );
}

function OwnerShareSection({ tripId }: { tripId: string }) {
  const [pendingRole, setPendingRole] = useState<MemberRole>('COLLABORATOR');
  const { data: shareInfo, isLoading } = useShareInfo(tripId);
  const generateLink = useGenerateShareLink(tripId);

  async function handleGenerate() {
    if (shareInfo?.shareCode) {
      if (!window.confirm('Regenerating the link will invalidate the old one. Continue?')) return;
    }
    await generateLink.mutateAsync(pendingRole);
  }

  if (isLoading) return <div className="h-9 rounded bg-gray-100 animate-pulse" />;

  if (shareInfo?.shareUrl && shareInfo.shareRole) {
    return (
      <div className="flex flex-col gap-2">
        <CopyableLink url={shareInfo.shareUrl} />
        <div className="flex items-center gap-2 text-xs text-sand-600">
          <span>Current link grants:</span>
          <span className="font-medium">{roleLabelFor(shareInfo.shareRole)}</span>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <span className="text-xs text-sand-600 shrink-0">New link role:</span>
          <select
            value={pendingRole}
            onChange={(e) => setPendingRole(e.target.value as MemberRole)}
            className="flex-1 rounded-md border border-sand-300 bg-white px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-ocean-400"
          >
            {ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <Button size="sm" variant="secondary" onClick={handleGenerate} loading={generateLink.isPending}>
            Regenerate
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 shrink-0">Grant role:</span>
        <select
          value={pendingRole}
          onChange={(e) => setPendingRole(e.target.value as MemberRole)}
          className="flex-1 rounded-md border border-sand-300 bg-white px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-ocean-400"
        >
          {ROLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      <Button onClick={handleGenerate} loading={generateLink.isPending} size="sm">
        Generate share link
      </Button>
    </div>
  );
}

function ViewerShareSection({ tripId }: { tripId: string }) {
  const { data: shareInfo, isLoading } = useShareInfo(tripId);

  if (isLoading) return <div className="h-9 rounded bg-gray-100 animate-pulse" />;

  if (shareInfo?.viewerShareUrl) {
    return (
      <div className="flex flex-col gap-2">
        <CopyableLink url={shareInfo.viewerShareUrl} />
        <p className="text-xs text-sand-500">Anyone who joins with this link will have <span className="font-medium">View Only</span> access.</p>
      </div>
    );
  }

  return (
    <p className="text-sm text-gray-500">No invite link has been generated yet.</p>
  );
}

export function ShareModal({ tripId, isOpen, onClose, currentUserId, isOwner }: Props) {
  const { data: shareInfo } = useShareInfo(tripId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Trip">
      <div className="flex flex-col gap-5">
        {/* Share link section */}
        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-700">
            {isOwner ? 'Share link' : 'View Only invite link'}
          </h3>
          {isOwner
            ? <OwnerShareSection tripId={tripId} />
            : <ViewerShareSection tripId={tripId} />
          }
        </div>

        {/* Members section */}
        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-700">
            Members ({shareInfo?.memberCount ?? '…'})
          </h3>
          <MemberList tripId={tripId} currentUserId={currentUserId} isOwner={isOwner} />
        </div>
      </div>
    </Modal>
  );
}
