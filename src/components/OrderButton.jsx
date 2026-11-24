/*
From Uiverse.io by nima-mollazadeh - https://uiverse.io/nima-mollazadeh/terrible-panda-97
MIT License, Copyright (c) nima-mollazadeh (XoCode)
*/

import React from 'react';

export default function OrderButton({
  children,
  type = 'button',
  className = '',
  style = {},
  disabled = false,
  onClick,
  ...rest
}) {
  return (
    <button
      type={type}
      className={`wf-order-btn ${className}`.trim()}
      style={style}
      disabled={disabled}
      onClick={onClick}
      {...rest}
    >
      <span>{children}</span>
    </button>
  );
}
