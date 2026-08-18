import { useState } from 'react';
import { Box, Stack, Fab, Dialog, DialogTitle, DialogContent, TextField, MenuItem, FormControlLabel, Switch, Button, DialogActions } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useApp } from '../hooks/useApp';
import { useBudgetData } from '../hooks/useBudget';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';
import BudgetCard from '../components/budget/BudgetCard';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { budgetsApi } from '../db';
import { monthKey, sumAmount, todayIso } from '../utils';
import type { Budget } from '../types';

export default function BudgetsPage() {
  const { categories, expenses } = useApp();
  const { budgets } = useBudgetData();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const thisMonth = monthKey(todayIso());
  const singleThisMonth = expenses.filter((e) => e.mode === 'single' && monthKey(e.date) === thisMonth);

  const spentFor = (b: Budget) =>
    b.categoryId === 'overall'
      ? sumAmount(singleThisMonth)
      : sumAmount(singleThisMonth.filter((e) => e.categoryId === b.categoryId));

  return (
    <Box>
      <PageHeader title="Budgets" subtitle="This month" />

      {budgets.length === 0 ? (
        <EmptyState icon="🎯" title="No budgets set" subtitle="Set a monthly limit per category to track your spending." />
      ) : (
        <Stack spacing={1.5}>
          {budgets.map((b) => (
            <BudgetCard
              key={b.id}
              budget={b}
              category={categories.find((c) => c.id === b.categoryId)}
              spent={spentFor(b)}
              onEdit={() => setEditing(b)}
              onDelete={() => setDeletingId(b.id)}
            />
          ))}
        </Stack>
      )}

      <Fab color="primary" sx={{ position: 'fixed', bottom: 88, right: 24 }} onClick={() => setCreating(true)}>
        <AddIcon />
      </Fab>

      <BudgetEditDialog open={creating} categories={categories} onClose={() => setCreating(false)} />
      {editing && (
        <BudgetEditDialog open categories={categories} initial={editing} onClose={() => setEditing(null)} />
      )}

      <ConfirmDialog
        open={!!deletingId}
        title="Delete budget?"
        message="This won't affect any logged expenses."
        confirmLabel="Delete"
        destructive
        onCancel={() => setDeletingId(null)}
        onConfirm={async () => {
          if (deletingId) await budgetsApi.delete(deletingId);
          setDeletingId(null);
        }}
      />
    </Box>
  );
}

function BudgetEditDialog({
  open,
  categories,
  initial,
  onClose,
}: {
  open: boolean;
  categories: { id: string; name: string; icon: string; color: string }[];
  initial?: Budget;
  onClose: () => void;
}) {
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? 'overall');
  const [limit, setLimit] = useState(initial ? String(initial.monthlyLimit) : '');
  const [rollover, setRollover] = useState(initial?.rollover ?? false);
  const [recurring, setRecurring] = useState(initial?.recurring ?? true);

  const handleSave = async () => {
    const n = Number(limit);
    if (!n || n <= 0) return;
    if (initial) {
      await budgetsApi.update({ ...initial, categoryId, monthlyLimit: n, rollover, recurring });
    } else {
      await budgetsApi.create({
        categoryId,
        monthlyLimit: n,
        rollover,
        recurring,
        month: recurring ? undefined : todayIso().slice(0, 7),
      });
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{initial ? 'Edit budget' : 'New budget'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField select label="Category" fullWidth value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <MenuItem value="overall">Overall (all categories)</MenuItem>
            {categories.map((c) => (
              <MenuItem key={c.id} value={c.id}>{c.icon} {c.name}</MenuItem>
            ))}
          </TextField>
          <TextField label="Monthly limit" type="number" fullWidth value={limit} onChange={(e) => setLimit(e.target.value)} />
          <FormControlLabel control={<Switch checked={recurring} onChange={(e) => setRecurring(e.target.checked)} />} label="Repeats every month" />
          <FormControlLabel control={<Switch checked={rollover} onChange={(e) => setRollover(e.target.checked)} />} label="Roll over unspent budget" />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button variant="contained" onClick={handleSave}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}
