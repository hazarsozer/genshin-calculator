'use client';

import { useState } from 'react';
import { useBuildStore } from '@/lib/store';
import { encodeBuild } from '@/lib/url';
import { Button } from '@/components/ui/button';

export function ShareButton() {
  const form = useBuildStore((s) => s.form);
  const [copied, setCopied] = useState(false);

  function handleShare() {
    const encoded = encodeBuild(form);
    window.location.hash = encoded;
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <Button variant="outline" size="sm" onClick={handleShare}>
      {copied ? 'Copied!' : 'Share Build'}
    </Button>
  );
}
