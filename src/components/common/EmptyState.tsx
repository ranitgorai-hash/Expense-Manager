import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';

export default function EmptyState({
  icon,
  title,
  subtitle,
  action,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <Box
      sx={{
        textAlign: 'center',
        py: 6,
        px: 2,
        color: 'text.secondary',
      }}
    >
      {icon && <Box sx={{ fontSize: 48, mb: 1, opacity: 0.6 }}>{icon}</Box>}
      <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 600 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" sx={{ mt: 0.5, maxWidth: 320, mx: 'auto' }}>
          {subtitle}
        </Typography>
      )}
      {action && <Box sx={{ mt: 2 }}>{action}</Box>}
    </Box>
  );
}
