import React from 'react';
import ProfessionalLayoutCatalog from '@/components/sarraaf/ProfessionalLayoutCatalog';

// The former catalogue reused one miniature dashboard for all 20 options.
// This entry now delegates to 20 purpose-built workspace architectures.
export default function LayoutDesignCatalog() {
  return <ProfessionalLayoutCatalog />;
}
