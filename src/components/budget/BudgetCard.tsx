import { Card, CardContent, Stack, IconButton, Typography, Chip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BudgetProgressBar from './BudgetProgressBar';
import type { Budget, Category } from '../../types';

export default function BudgetCard({
  budget,
  category,
  spent,
  onEdit,
  onDelete,
}: {
  budget: Budget;
  category?: Category;
  spent: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const pct = budget.monthlyLimit > 0 ? Math.round((spent / budget.monthlyLimit) * 100) : 0;
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle1">
              {category ? `${category.icon} ${category.name}` : 'Overall budget'}
            </Typography>
            {budget.rollover && <Chip size="small" label="Rollover" />}
            {budget.recurring && <Chip size="small" label="Recurring" variant="outlined" />}
          </Stack>
          <Stack direction="row">
            <IconButton size="small" onClick={onEdit}><EditIcon fontSize="small" /></IconButton>
            <IconButton size="small" onClick={onDelete}><DeleteIcon fontSize="small" /></IconButton>
          </Stack>
        </Stack>
        <Stack sx={{ mt: 1.5 }} spacing={0.5}>
          <BudgetProgressBar spent={spent} limit={budget.monthlyLimit} />
          <Typography variant="caption" color="text.secondary">
            {pct}% used
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
