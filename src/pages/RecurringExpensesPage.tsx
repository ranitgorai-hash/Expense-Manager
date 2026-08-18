import { useState } from 'react';
import { Box, Stack, Fab, Dialog, DialogTitle, DialogContent, List, ListItem, ListItemText, Chip, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useApp } from '../hooks/useApp';
import { useBudgetData } from '../hooks/useBudget';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';
import RecurringExpenseForm from '../components/budget/RecurringExpenseForm';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { recurringExpensesApi } from '../db';
import { daysUntil, forecastCost, upcomingWithinDays } from '../utils/recurring';
import { formatCurrency, formatDate } from '../utils';

export default function RecurringExpensesPage() {
  const { categories } = useApp();
  const { recurringExpenses } = useBudgetData();
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const upcoming = upcomingWithinDays(recurringExpenses, 30);
  const forecast30 = forecastCost(recurringExpenses, 30);
  const forecast90 = forecastCost(recurringExpenses, 90);

  const catFor = (id: string) => categories.find((c) => c.id === id);

  return (
    <Box>
      <PageHeader title="Recurring Expenses" subtitle="Subscriptions, rent, EMIs, and other repeating costs" />

      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Chip label={`Next 30 days: ${formatCurrency(forecast30)}`} color="primary" variant="outlined" />
        <Chip label={`Next 90 days: ${formatCurrency(forecast90)}`} color="secondary" variant="outlined" />
      </Stack>

      {recurringExpenses.length === 0 ? (
        <EmptyState icon="🔁" title="No recurring expenses yet" subtitle="Track rent, subscriptions, and EMIs so nothing surprises you." />
      ) : upcoming.length === 0 ? (
        <EmptyState title="Nothing due in the next 30 days" />
      ) : (
        <List disablePadding>
          {upcoming.map((re) => {
            const d = daysUntil(re.nextDueDate);
            const cat = catFor(re.categoryId);
            return (
              <ListItem
                key={re.id}
                divider
                secondaryAction={
                  <IconButton edge="end" onClick={() => setDeletingId(re.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={`${cat?.icon ?? ''} ${re.name} · ${formatCurrency(re.amount)}`}
                  secondary={`Due ${formatDate(re.nextDueDate)} (${d === 0 ? 'today' : d < 0 ? `${-d}d overdue` : `in ${d}d`}) · ${re.autoLog ? 'Auto-logs' : 'Reminder only'}`}
                />
              </ListItem>
            );
          })}
        </List>
      )}

      <Fab color="primary" sx={{ position: 'fixed', bottom: 88, right: 24 }} onClick={() => setCreating(true)}>
        <AddIcon />
      </Fab>

      <Dialog open={creating} onClose={() => setCreating(false)} fullWidth maxWidth="xs">
        <DialogTitle>New recurring expense</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <RecurringExpenseForm
              categories={categories}
              submitLabel="Create"
              onSubmit={async (value) => {
                await recurringExpensesApi.create(value);
                setCreating(false);
              }}
            />
          </Box>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deletingId}
        title="Delete recurring expense?"
        message="This won't affect any expenses already logged."
        confirmLabel="Delete"
        destructive
        onCancel={() => setDeletingId(null)}
        onConfirm={async () => {
          if (deletingId) await recurringExpensesApi.delete(deletingId);
          setDeletingId(null);
        }}
      />
    </Box>
  );
}
