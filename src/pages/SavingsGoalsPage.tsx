import { useState } from 'react';
import { Box, Stack, Fab, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Avatar } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useBudgetData } from '../hooks/useBudget';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';
import GoalCard from '../components/budget/GoalCard';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { savingsGoalsApi } from '../db';
import type { SavingsGoal } from '../types';

const ICON_CHOICES = ['💻', '✈️', '🏠', '🚗', '🎓', '💍', '🏥', '🎉'];
const COLOR_CHOICES = ['#E8895A', '#4C9A6E', '#D6A44A', '#4A7FBF', '#9B6BB0'];

export default function SavingsGoalsPage() {
  const { savingsGoals } = useBudgetData();
  const [creating, setCreating] = useState(false);
  const [contributingTo, setContributingTo] = useState<SavingsGoal | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  return (
    <Box>
      <PageHeader title="Savings Goals" />

      {savingsGoals.length === 0 ? (
        <EmptyState icon="🏆" title="No goals yet" subtitle="Name something you're saving for and track your progress." />
      ) : (
        <Stack spacing={1.5}>
          {savingsGoals.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              onContribute={() => setContributingTo(g)}
              onDelete={() => setDeletingId(g.id)}
            />
          ))}
        </Stack>
      )}

      <Fab color="primary" sx={{ position: 'fixed', bottom: 88, right: 24 }} onClick={() => setCreating(true)}>
        <AddIcon />
      </Fab>

      <NewGoalDialog open={creating} onClose={() => setCreating(false)} />

      {contributingTo && (
        <ContributeDialog goal={contributingTo} onClose={() => setContributingTo(null)} />
      )}

      <ConfirmDialog
        open={!!deletingId}
        title="Delete goal?"
        message="This can't be undone."
        confirmLabel="Delete"
        destructive
        onCancel={() => setDeletingId(null)}
        onConfirm={async () => {
          if (deletingId) await savingsGoalsApi.delete(deletingId);
          setDeletingId(null);
        }}
      />
    </Box>
  );
}

function NewGoalDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [icon, setIcon] = useState(ICON_CHOICES[0]);
  const [color, setColor] = useState(COLOR_CHOICES[0]);

  const handleSave = async () => {
    const n = Number(target);
    if (!name.trim() || !n || n <= 0) return;
    await savingsGoalsApi.create({
      name: name.trim(),
      targetAmount: n,
      currentAmount: 0,
      targetDate: targetDate || undefined,
      icon,
      color,
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>New savings goal</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Goal name" fullWidth value={name} onChange={(e) => setName(e.target.value)} />
          <TextField label="Target amount" type="number" fullWidth value={target} onChange={(e) => setTarget(e.target.value)} />
          <TextField
            label="Target date (optional)"
            type="date"
            fullWidth
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <Stack direction="row" gap={1} flexWrap="wrap">
            {ICON_CHOICES.map((i) => (
              <Avatar key={i} onClick={() => setIcon(i)} sx={{ cursor: 'pointer', border: icon === i ? '2px solid' : 'none', borderColor: 'primary.main' }}>{i}</Avatar>
            ))}
          </Stack>
          <Stack direction="row" gap={1} flexWrap="wrap">
            {COLOR_CHOICES.map((c) => (
              <Box key={c} onClick={() => setColor(c)} sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: c, cursor: 'pointer', border: color === c ? '3px solid black' : 'none' }} />
            ))}
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button variant="contained" onClick={handleSave}>Create</Button>
      </DialogActions>
    </Dialog>
  );
}

function ContributeDialog({ goal, onClose }: { goal: SavingsGoal; onClose: () => void }) {
  const [amount, setAmount] = useState('');

  const handleSave = async () => {
    const n = Number(amount);
    if (!n) return;
    await savingsGoalsApi.update({ ...goal, currentAmount: Math.max(0, goal.currentAmount + n) });
    onClose();
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Contribute to {goal.name}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          sx={{ mt: 1 }}
          label="Amount (use negative to withdraw)"
          type="number"
          fullWidth
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button variant="contained" onClick={handleSave}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}
