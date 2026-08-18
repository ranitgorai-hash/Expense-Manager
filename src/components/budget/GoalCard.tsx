import { Card, CardContent, Stack, Typography, IconButton, LinearProgress, Avatar } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import type { SavingsGoal } from '../../types';
import { formatCurrency, formatDate } from '../../utils';

export default function GoalCard({
  goal,
  onContribute,
  onDelete,
}: {
  goal: SavingsGoal;
  onContribute: () => void;
  onDelete: () => void;
}) {
  const pct = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;

  // Simple linear projection from creation to now
  let projectedText = '';
  if (goal.targetDate) {
    projectedText = `Target: ${formatDate(goal.targetDate)}`;
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ bgcolor: goal.color }}>{goal.icon}</Avatar>
            <Stack>
              <Typography variant="subtitle1">{goal.name}</Typography>
              {projectedText && (
                <Typography variant="caption" color="text.secondary">{projectedText}</Typography>
              )}
            </Stack>
          </Stack>
          <Stack direction="row">
            <IconButton size="small" onClick={onContribute}><EditIcon fontSize="small" /></IconButton>
            <IconButton size="small" onClick={onDelete}><DeleteIcon fontSize="small" /></IconButton>
          </Stack>
        </Stack>
        <Stack sx={{ mt: 1.5 }} spacing={0.5}>
          <LinearProgress variant="determinate" value={pct} sx={{ height: 8, borderRadius: 4 }} />
          <Typography variant="caption" color="text.secondary">
            {formatCurrency(goal.currentAmount)} of {formatCurrency(goal.targetAmount)} ({Math.round(pct)}%)
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
