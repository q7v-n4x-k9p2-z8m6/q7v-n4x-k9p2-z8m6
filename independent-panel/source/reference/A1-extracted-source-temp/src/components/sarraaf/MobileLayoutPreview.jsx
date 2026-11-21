import React from 'react';
import ComputerLayoutPreview from '@/components/sarraaf/ComputerLayoutPreview';

export default function MobileLayoutPreview() {
  return (
    <div className="creator-mobile-preview w-full min-w-0">
      <ComputerLayoutPreview />
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
        .creator-mobile-lab .creator-preview-menus {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 4px;
          padding: 4px;
        }
        .creator-mobile-lab .creator-preview-menus > div {
          min-width: 0;
        }
        .creator-mobile-lab .creator-preview-menus > div > button {
          width: 100%;
          min-height: 44px;
          padding-inline: 6px;
        }
        .creator-mobile-lab .creator-preview-menus [class*="absolute"] {
          max-width: calc(100vw - 52px);
          z-index: 50;
        }
        .creator-mobile-lab .creator-preview-device aside button {
          min-height: 64px;
          touch-action: manipulation;
        }
        .creator-mobile-lab .creator-preview-device main {
          overscroll-behavior: contain;
        }
        .creator-mobile-lab .creator-preview-device table {
          font-size: 11px;
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
          min-height: 42px;
        }
        @media (max-width: 380px) {
          .creator-mobile-lab .creator-preview-menus {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .creator-mobile-lab .creator-preview-device {
            min-height: 600px;
          }
        }
      `}</style>
    </div>
  );
}
