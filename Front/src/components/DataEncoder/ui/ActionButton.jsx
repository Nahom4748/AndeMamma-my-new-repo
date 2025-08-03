// components/ui/ActionButton.jsx
import React from 'react';
import { Button } from 'antd';

const ActionButton = ({ color = '#10b981', children, ...props }) => {
  return (
    <Button
      {...props}
      style={{
        backgroundColor: props.type === 'primary' ? color : undefined,
        borderColor: props.type === 'default' ? color : undefined,
        color: props.type === 'default' ? color : undefined,
        borderRadius: 8,
        ...props.style
      }}
    >
      {children}
    </Button>
  );
};

export default ActionButton;