import { Box, Typography, Stack } from '@mui/material';
import type { ReactNode } from 'react';

export default function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 2 }}>
      <Box>
        <Typography variant="h6">{title}</Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      {action}
    </Stack>
  );
}
