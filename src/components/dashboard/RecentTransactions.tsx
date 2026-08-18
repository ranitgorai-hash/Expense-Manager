import { List, ListItem, ListItemAvatar, Avatar, ListItemText, Typography, Box } from '@mui/material';
import type { Expense, Category } from '../../types';
import { formatCurrency, formatDate } from '../../utils';
import EmptyState from '../common/EmptyState';

export default function RecentTransactions({
  expenses,
  categories,
  limit = 8,
}: {
  expenses: Expense[];
  categories: Category[];
  limit?: number;
}) {
  const sorted = [...expenses]
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
    .slice(0, limit);

  if (sorted.length === 0) {
    return <EmptyState icon="🧾" title="No transactions yet" subtitle="Log your first expense to see it here." />;
  }

  const catFor = (id: string) => categories.find((c) => c.id === id);

  return (
    <List disablePadding>
      {sorted.map((e) => {
        const cat = catFor(e.categoryId);
        return (
          <ListItem key={e.id} disableGutters divider>
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: cat?.color ?? 'grey.400' }}>{cat?.icon ?? '💸'}</Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={e.name}
              secondary={`${cat?.name ?? 'Other'} · ${formatDate(e.date)}`}
            />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {formatCurrency(e.amount)}
              </Typography>
            </Box>
          </ListItem>
        );
      })}
    </List>
  );
}
