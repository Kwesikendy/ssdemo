import React from 'react';
import { AlertTriangle, AlertCircle, Info, XCircle } from 'lucide-react';

const SeverityBadge = ({ severity, size = 'sm' }) => {
  const getSeverityConfig = (severity) => {
    switch (severity) {
      case 'critical':
        return {
          icon: XCircle,
          className: 'text-red-600 bg-red-100',
          text: 'Critical'
        };
      case 'high':
        return {
          icon: AlertCircle,
          className: 'text-orange-600 bg-orange-100',
          text: 'High'
        };
      case 'medium':
        return {
          icon: AlertTriangle,
          className: 'text-yellow-600 bg-yellow-100',
          text: 'Medium'
        };
      case 'low':
        return {
          icon: Info,
          className: 'text-blue-600 bg-blue-100',
          text: 'Low'
        };
      default:
        return {
          icon: AlertTriangle,
          className: 'text-gray-600 bg-gray-100',
          text: severity
        };
    }
  };

  const config = getSeverityConfig(severity);
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <span className={`inline-flex items-center space-x-1 rounded-full font-medium ${config.className} ${sizeClasses[size]}`}>
      <Icon className="h-3 w-3" />
      <span>{config.text}</span>
    </span>
  );
};

export default SeverityBadge;

