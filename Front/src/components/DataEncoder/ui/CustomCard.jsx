// components/ui/CustomCard.jsx
import React from 'react';
import { Card } from 'antd';

const CustomCard = ({ children, ...props }) => {
  return (
    <Card
      {...props}
      style={{ 
        borderRadius: 12,
        boxShadow: '0 1px 20px 0 rgba(0,0,0,0.05)',
        ...props.style
      }}
      bodyStyle={{ 
        padding: 24,
        ...props.bodyStyle
      }}
    >
      {children}
    </Card>
  );
};

export default CustomCard;