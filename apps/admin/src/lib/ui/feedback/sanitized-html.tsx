'use client';

import * as React from 'react';
import DOMPurify, { type Config as DOMPurifyConfig } from 'dompurify';

/**
 * SanitizedHTML - safe HTML rendering via DOMPurify.
 *
 * Use this instead of React's dangerouslySetInnerHTML anywhere
 * user-supplied or API-supplied HTML is rendered.
 */

export interface SanitizedHTMLProps {
  /** Raw untrusted HTML string */
  html: string;
  /** Tag to render as, default div */
  as?: keyof React.JSX.IntrinsicElements;
  /** Additional class names on the wrapper */
  className?: string;
  /** DOMPurify config overrides, use sparingly */
  purifyOptions?: DOMPurifyConfig;
}

const PURIFY_CONFIG: DOMPurifyConfig = {
  ALLOWED_TAGS: [
    'a', 'b', 'br', 'code', 'del', 'em', 'h1', 'h2', 'h3', 'h4',
    'h5', 'h6', 'hr', 'i', 'img', 'ins', 'li', 'ol', 'p', 'pre',
    's', 'small', 'span', 'strong', 'sub', 'sup', 'table', 'tbody',
    'td', 'th', 'thead', 'tr', 'ul',
  ],
  ALLOWED_ATTR: [
    'alt', 'class', 'colspan', 'height', 'href', 'loading',
    'rowspan', 'src', 'style', 'target', 'title', 'width', 'rel',
  ],
  ALLOW_DATA_ATTR: false,
};

export function SanitizedHTML({
  html,
  as: Tag = 'div',
  className,
  purifyOptions,
}: SanitizedHTMLProps) {
  const sanitized = React.useMemo(
    () => DOMPurify.sanitize(html, { ...PURIFY_CONFIG, ...purifyOptions }),
    [html, purifyOptions],
  );
  const Component = Tag as React.ElementType;

  return <Component className={className} dangerouslySetInnerHTML={{ __html: sanitized }} />;
}

SanitizedHTML.displayName = 'SanitizedHTML';
