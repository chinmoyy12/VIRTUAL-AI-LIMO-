import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { useOmega } from '../context/OmegaContext.tsx';
import { OmegaModal } from './omega/OmegaTransitions.tsx';
import { OmegaButton } from './omega/OmegaButton.tsx';

export const PermissionModal: React.FC = () => {
  const { pendingPermission, closePermissionModal } = useOmega();

  return (
    <OmegaModal
      isOpen={Boolean(pendingPermission)}
      onClose={closePermissionModal}
      ariaLabel="Permission Required"
      maxWidthClass="max-w-md"
    >
      {pendingPermission && (
        <div className="p-6 flex flex-col gap-5">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-[#FBBF24]/10 text-[#FBBF24] shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono-tabular uppercase tracking-wider text-[#FBBF24]">
                PERMISSION
              </span>
              <h2 className="text-heading mt-0.5">OMEGA wants to execute…</h2>
              <p className="text-body font-medium mt-1">{pendingPermission.action}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#121714] border border-white/[0.06] text-xs text-[#9BA39D] leading-relaxed">
            {pendingPermission.details}
          </div>

          <div className="flex items-center justify-end gap-2.5">
            <OmegaButton
              variant="secondary"
              onClick={() => {
                pendingPermission.onDeny();
                closePermissionModal();
              }}
            >
              Deny
            </OmegaButton>
            <OmegaButton
              variant="primary"
              onClick={() => {
                pendingPermission.onConfirm();
                closePermissionModal();
              }}
            >
              Allow
            </OmegaButton>
          </div>
        </div>
      )}
    </OmegaModal>
  );
};
