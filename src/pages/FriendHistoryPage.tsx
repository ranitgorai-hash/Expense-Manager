import { useState } from 'react';
import { Box, Stack, Button, Typography, List, ListItem, ListItemText, Chip } from '@mui/material';
import { useApp } from '../hooks/useApp';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';
import { formatCurrency, formatDate, groupByDate } from '../utils';

export default function FriendHistoryPage() {
  const { friends, expenses, categories } = useApp();
  const activeFriends = friends.filter((f) => f.active);
  const [selectedId, setSelectedId] = useState<string | null>(activeFriends[0]?.id ?? null);

  if (activeFriends.length === 0) {
    return (
      <Box>
        <PageHeader title="Friend History" />
        <EmptyState icon="📜" title="No friends yet" />
      </Box>
    );
  }

  const selected = activeFriends.find((f) => f.id === selectedId) ?? activeFriends[0];

  const friendExpenses = expenses.filter(
    (e) => e.mode === 'group' && (e.paidBy === selected.id || e.paidFor === selected.id)
  );

  const grouped = groupByDate(friendExpenses);
  let running = 0;

  return (
    <Box>
      <PageHeader title="Friend History" />
      <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mb: 2 }}>
        {activeFriends.map((f) => (
          <Button
            key={f.id}
            size="small"
            variant={f.id === selected.id ? 'contained' : 'outlined'}
            onClick={() => setSelectedId(f.id)}
          >
            {f.name}
          </Button>
        ))}
      </Stack>

      {grouped.length === 0 ? (
        <EmptyState title={`No transactions with ${selected.name} yet`} />
      ) : (
        grouped
          .slice() // grouped is newest-first; walk oldest-first to accumulate running balance
          .reverse()
          .map(({ date, items }) => {
            for (const e of items) {
              if (e.paidBy === 'user' && e.paidFor === selected.id) running += e.amount;
              else if (e.paidBy === selected.id && e.paidFor === 'user') running -= e.amount;
            }
            return { date, items, runningAtDate: running };
          })
          .reverse() // back to newest-first for display
          .map(({ date, items, runningAtDate }) => {
            const cat = (id: string) => categories.find((c) => c.id === id);
            return (
              <Box key={date} sx={{ mb: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {formatDate(date)}
                  </Typography>
                  <Chip
                    size="small"
                    color={runningAtDate > 0 ? 'success' : runningAtDate < 0 ? 'error' : 'default'}
                    label={
                      runningAtDate === 0
                        ? 'Settled'
                        : runningAtDate > 0
                        ? `Owes you ${formatCurrency(runningAtDate)}`
                        : `You owe ${formatCurrency(-runningAtDate)}`
                    }
                  />
                </Stack>
                <List disablePadding>
                  {items.map((e) => (
                    <ListItem key={e.id} divider>
                      <ListItemText
                        primary={`${cat(e.categoryId)?.icon ?? ''} ${e.name}`}
                        secondary={
                          e.paidBy === 'user'
                            ? `You paid, for ${selected.name}`
                            : `${selected.name} paid, for you`
                        }
                      />
                      <Typography sx={{ fontWeight: 700 }}>{formatCurrency(e.amount)}</Typography>
                    </ListItem>
                  ))}
                </List>
              </Box>
            );
          })
      )}
    </Box>
  );
}
