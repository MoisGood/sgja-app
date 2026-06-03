import { type ReactNode, type CSSProperties } from 'react';

type Props = { children: ReactNode };

export default function MobileSwipeWrapper({ children }: Props) {
  const style: CSSProperties = {
    width: '100%',
    minHeight: '100dvh',
    position: 'relative',
  };
  return <div style={style}>{children}</div>;
}
