import React from 'react';

export function TextArea({ className = '', ...props }: any) {
  return (
    <textarea className={`${className}`} {...props} />
  );
}
