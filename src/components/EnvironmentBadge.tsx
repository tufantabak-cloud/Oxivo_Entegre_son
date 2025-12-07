/**
 * 🏷️ Environment Badge
 * Shows current environment in development/preview mode
 * Hidden in production
 */

import React from 'react';
import { ENV_CONFIG, getEnvironmentName, getEnvironmentColor, IS_PRODUCTION } from '../utils/environmentConfig';

export function EnvironmentBadge() {
  // ✅ Hide badge in production
  if (!ENV_CONFIG.showEnvironmentBadge || IS_PRODUCTION) {
    return null;
  }

  const envName = getEnvironmentName();
  const envColor = getEnvironmentColor();

  return (
    <div className="fixed top-0 left-0 z-[9999] pointer-events-none">
      <div className={`${envColor} text-white px-3 py-1 text-xs font-mono shadow-lg`}>
        {envName}
      </div>
    </div>
  );
}
