/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import * as icons from "lucide-react";

interface LucideIconProps {
  name: string;
  className?: string;
  size?: number;
}

export default function LucideIcon({ name, className = "", size = 20 }: LucideIconProps) {
  // Safe dynamic fallback to avoid compile/runtime issues
  const IconComponent = (icons as any)[name];
  
  if (!IconComponent) {
    // Return HelpCircle as a safe fallback
    return <icons.HelpCircle className={className} size={size} id={`fallback-icon-${name}`} />;
  }

  return <IconComponent className={className} size={size} id={`lucide-icon-${name}`} />;
}
