import { useState } from 'react';
import { Box, Stack, Chip, Fab, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, List, ListItem, ListItemText, Checkbox } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useApp } from '../hooks/useApp';
import { useBudgetData } from '../hooks/useBudget';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';
import { tagsApi, expensesApi } from '../db';
import { formatCurrency, formatDate } from '../utils';

const COLOR_CHOICES = ['#E8895A', '#4C9A6E', '#D6A44A', '#4A7FBF', '#9B6BB0', '#C25B5B'];

export default function TagsPage() {
  const { expenses, categories } = useApp();
  const { tags } = useBudgetData();
  const [creating, setCreating] = useState(false);
  const [activeTagId, setActiveTagId] = useState<string | null>(null);

  const reimbursable = expenses.filter(
    (e) => e.mode === 'single' && (e.tagIds ?? []).some((id) => tags.find((t) => t.id === id)?.name.toLowerCase() === 'reimbursable')
  );

  const taggedExpenses = activeTagId
    ? expenses.filter((e) => e.mode === 'single' && (e.tagIds ?? []).includes(activeTagId))
    : [];

  return (
    <Box>
      <PageHeader title="Tags" subtitle="Cross-cutting labels, independent of category" />

      {tags.length === 0 ? (
        <EmptyState icon="🏷️" title="No tags yet" subtitle="Create tags like #work or #trip-goa to filter across categories." />
      ) : (
        <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mb: 3 }}>
          {tags.map((t) => (
            <Chip
              key={t.id}
              label={`#${t.name}`}
              onClick={() => setActiveTagId(activeTagId === t.id ? null : t.id)}
              variant={activeTagId === t.id ? 'filled' : 'outlined'}
              sx={{ bgcolor: activeTagId === t.id ? t.color : undefined, color: activeTagId === t.id ? '#fff' : undefined }}
              onDelete={() => tagsApi.delete(t.id)}
            />
          ))}
        </Stack>
      )}

      {activeTagId && (
        <Box sx={{ mb: 3 }}>
          <PageHeader title={`#${tags.find((t) => t.id === activeTagId)?.name}`} />
          {taggedExpenses.length === 0 ? (
            <EmptyState title="No expenses with this tag" />
          ) : (
            <List disablePadding>
              {taggedExpenses.map((e) => (
                <ListItem key={e.id} divider>
                  <ListItemText
                    primary={e.name}
                    secondary={`${categories.find((c) => c.id === e.categoryId)?.name} · ${formatDate(e.date)}`}
                  />
                  <Chip size="small" label={formatCurrency(e.amount)} />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      )}

      {reimbursable.length > 0 && (
        <Box>
          <PageHeader title="Reimbursable" subtitle="One-directional local status, separate from Group Mode settlements" />
          <List disablePadding>
            {reimbursable.map((e) => (
              <ListItem
                key={e.id}
                divider
                secondaryAction={
                  <Checkbox
                    checked={!!e.reimbursed}
                    onChange={(ev) => expensesApi.update({ ...e, reimbursed: ev.target.checked })}
                  />
                }
              >
                <ListItemText primary={e.name} secondary={`${formatCurrency(e.amount)} · ${formatDate(e.date)}`} />
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      <Fab color="primary" sx={{ position: 'fixed', bottom: 88, right: 24 }} onClick={() => setCreating(true)}>
        <AddIcon />
      </Fab>

      <NewTagDialog open={creating} onClose={() => setCreating(false)} />
    </Box>
  );
}

function NewTagDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLOR_CHOICES[0]);

  const handleSave = async () => {
    if (!name.trim()) return;
    await tagsApi.create(name.trim().replace(/^#/, ''), color);
    setName('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>New tag</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Tag name" fullWidth value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. work, trip-goa" />
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
