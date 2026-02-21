'use client';

import { useState } from 'react';
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

export function ShareModal({ tripId, isOpen, onClose, currentUserId, isOwner }: Props) {
  const [copied, setCopied] = useState(false);
  const { data: shareInfo, isLoading } = useShareInfo(tripId);
  const generateLink = useGenerateShareLink(tripId);

  async function handleGenerate() {
    if (shareInfo?.shareCode) {
      if (!window.confirm('Regenerating the link will invalidate the old one. Continue?')) return;
    }
    await generateLink.mutateAsync();
  }

  async function handleCopy() {
    if (!shareInfo?.shareUrl) return;
    await navigator.clipboard.writeText(shareInfo.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Trip">
      <div className="flex flex-col gap-5">
        {/* Share link section */}
        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-700">Share link</h3>
          {isLoading ? (
            <div className="h-9 rounded bg-gray-100 animate-pulse" />
          ) : shareInfo?.shareUrl ? (
            <div className="flex gap-2">
              <input
                readOnly
                value={shareInfo.shareUrl}
                className="flex-1 rounded-md border border-sand-300 bg-sand-50 px-3 py-2 text-sm text-sand-600 truncate focus:outline-none"
              />
              <Button size="sm" variant="secondary" onClick={handleCopy}>
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              {isOwner && (
                <Button size="sm" variant="secondary" onClick={handleGenerate} loading={generateLink.isPending}>
                  Regenerate
                </Button>
              )}
            </div>
          ) : isOwner ? (
            <Button onClick={handleGenerate} loading={generateLink.isPending} size="sm">
              Generate share link
            </Button>
          ) : (
            <p className="text-sm text-gray-500">No share link has been generated yet.</p>
          )}
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
