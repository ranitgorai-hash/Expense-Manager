import { Chip, Stack, Typography } from '@mui/material';
import type { QuickExpense, Category } from '../../types';
import { formatCurrency } from '../../utils';

export default function QuickExpenseButtons({
  quickExpenses,
  categories,
  onPick,
}: {
  quickExpenses: QuickExpense[];
  categories: Category[];
  onPick: (qe: QuickExpense) => void;
}) {
  if (quickExpenses.length === 0) return null;

  const catFor = (id: string) => categories.find((c) => c.id === id);

  return (
    <Stack spacing={1} sx={{ mb: 2 }}>
      <Typography variant="subtitle2" color="text.secondary">
        Quick Add
      </Typography>
      <Stack direction="row" flexWrap="wrap" gap={1}>
        {quickExpenses.map((qe) => {
          const cat = catFor(qe.categoryId);
          return (
            <Chip
              key={qe.id}
              label={`${cat?.icon ?? ''} ${qe.name} · ${formatCurrency(qe.amount)}`}
              onClick={() => onPick(qe)}
              sx={{ fontWeight: 600 }}
              color="primary"
              variant="outlined"
            />
          );
        })}
      </Stack>
    </Stack>
  );
}
