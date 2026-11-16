import React from 'react';
import CreatorPreviewLab from '@/components/sarraaf/CreatorPreviewLab';

export default function MobileLayoutPreview() {
  return (
    <div className="creator-mobile-preview w-full min-w-0">
      <CreatorPreviewLab mobileMode />
      <style>{`
        .creator-mobile-preview,
        .creator-mobile-lab {
          width: 100%;
          min-width: 0;
        }
        .creator-mobile-lab .creator-preview-device {
          width: 100%;
          max-width: 430px;
          min-width: 0;
          min-height: 620px;
          max-height: 82vh;
          height: min(82vh, 820px);
          margin-inline: auto;
        }
        .creator-mobile-lab .creator-preview-device {
          position: relative;
          background: #f4f7fb;
          border-radius: 24px;
          box-shadow: 0 16px 40px rgba(15, 35, 55, .18);
        }
        .creator-mobile-lab .creator-preview-device > div {
          display: flex;
          flex: 1 1 auto;
          min-height: 0;
          flex-direction: column;
        }
        .creator-mobile-lab .creator-preview-device > div > aside.creator-mobile-module-dock {
          order: 2;
          display: flex;
          flex: 0 0 auto;
          width: 100%;
          gap: 7px;
          overflow-x: auto;
          overflow-y: hidden;
          border-top: 1px solid #cbd5e1;
          border-bottom: 0;
          background: #fff;
          padding: 8px 7px calc(8px + env(safe-area-inset-bottom));
          scrollbar-width: thin;
          overscroll-behavior-x: contain;
        }
        .creator-mobile-lab .creator-preview-device > div > aside.creator-mobile-module-dock > button {
          display: flex;
          flex: 0 0 72px;
          min-width: 72px;
          min-height: 62px;
          gap: 5px;
          border: 1px solid #e2e8f0;
          border-radius: 13px;
          background: #f8fafc;
          padding: 7px 4px;
          touch-action: manipulation;
        }
        .creator-mobile-lab .creator-preview-device > div > aside.creator-mobile-module-dock > button svg {
          width: 20px;
          height: 20px;
        }
        .creator-mobile-lab .creator-preview-device > div > aside.creator-mobile-module-dock > button span {
          font-size: 9px;
          line-height: 1.25;
        }
        .creator-mobile-lab .creator-preview-device > div > main {
          order: 1;
          flex: 1 1 auto;
          min-height: 0;
          width: 100%;
          overflow-x: hidden;
          overflow-y: auto;
          padding: 12px;
          overscroll-behavior: contain;
        }
        .creator-mobile-lab .creator-preview-device main > div:first-child {
          gap: 8px;
        }
        .creator-mobile-lab .creator-preview-device .creator-mobile-records {
          width: 100%;
        }
        .creator-mobile-lab .creator-mobile-records > button {
          min-height: 76px;
          text-align: right;
          touch-action: manipulation;
        }
        .creator-mobile-lab .creator-preview-device .v21-module-tile,
        .creator-mobile-lab .creator-preview-device button.v21-module-tile {
          min-height: 88px;
          border-radius: 15px;
          padding: 10px 7px;
        }
        .creator-mobile-lab .creator-preview-device .v21-module-icon {
          width: 42px;
          height: 42px;
          border-radius: 13px;
        }
        .creator-mobile-lab .creator-preview-device input,
        .creator-mobile-lab .creator-preview-device select,
        .creator-mobile-lab .creator-preview-device textarea,
        .creator-mobile-lab .creator-preview-device button {
          touch-action: manipulation;
        }
        .creator-mobile-lab .creator-preview-device input,
        .creator-mobile-lab .creator-preview-device select,
        .creator-mobile-lab .creator-preview-device textarea {
          min-height: 44px;
          max-width: 100%;
        }
        .creator-mobile-lab .creator-preview-device table {
          font-size: 11px;
        }
        .creator-mobile-lab .creator-preview-device [class*="fixed inset-0"] > div {
          width: 100%;
          max-width: 100%;
          max-height: 94vh;
          border-radius: 18px 18px 0 0;
          margin-top: auto;
        }
        .creator-mobile-lab .creator-preview-device [class*="fixed inset-0"] {
          align-items: flex-end;
          padding: 0;
        }
        .creator-mobile-lab .creator-preview-device .grid.gap-3.p-4 {
          grid-template-columns: minmax(0, 1fr);
          padding: 14px;
        }
        .creator-mobile-lab .creator-preview-device footer {
          padding-bottom: calc(8px + env(safe-area-inset-bottom));
        }
        @media (max-width: 380px) {
          .creator-mobile-lab .creator-preview-device {
            min-height: 600px;
            border-radius: 20px;
          }
          .creator-mobile-lab .creator-preview-device > div > aside.creator-mobile-module-dock > button {
            flex-basis: 66px;
            min-width: 66px;
          }
        }
      `}</style>
    </div>
  );
}
