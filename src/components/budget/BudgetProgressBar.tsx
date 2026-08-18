import { Box, LinearProgress, Typography, Stack } from '@mui/material';
import { formatCurrency } from '../../utils';

export default function BudgetProgressBar({
  spent,
  limit,
  label,
}: {
  spent: number;
  limit: number;
  label?: string;
}) {
  const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
  const color = pct >= 100 ? 'error' : pct >= 80 ? 'warning' : 'success';

  return (
    <Box>
      {label && (
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
          <Typography variant="body2">{label}</Typography>
          <Typography variant="body2" color="text.secondary">
            {formatCurrency(spent)} / {formatCurrency(limit)}
          </Typography>
        </Stack>
      )}
      <LinearProgress
        variant="determinate"
        value={pct}
        color={color as 'success' | 'warning' | 'error'}
        sx={{ height: 8, borderRadius: 4 }}
      />
    </Box>
  );
}
