import React, { ReactNode } from 'react';

interface Props { children: ReactNode }

export default function MiniKitProvider({ children }: Props) {
  return <>{children}</>;
}
