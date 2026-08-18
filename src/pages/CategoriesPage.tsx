import { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  IconButton,
  Collapse,
  Typography,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useApp } from '../hooks/useApp';
import PageHeader from '../components/common/PageHeader';
import ConfirmDialog from '../components/common/ConfirmDialog';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import { categoriesApi } from '../db';
import { formatCurrency, sumAmount } from '../utils';
import type { Category } from '../types';

const EMOJI_CHOICES = ['🍔', '🚌', '🛍️', '🏠', '💊', '📚', '🎬', '🧾', '📦', '☕', '✈️', '🎁', '🐾', '🏋️', '💼'];
const COLOR_CHOICES = ['#E8895A', '#4C9A6E', '#D6A44A', '#4A7FBF', '#9B6BB0', '#C25B5B', '#5A8FA0', '#8B5E3C'];

export default function CategoriesPage() {
  const { categories, visibleExpenses } = useApp();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const totalsFor = (catId: string) => visibleExpenses.filter((e) => e.categoryId === catId);

  return (
    <Box>
      <PageHeader title="Categories" />
      <List disablePadding>
        {categories.map((c) => {
          const items = totalsFor(c.id);
          const total = sumAmount(items);
          const expanded = expandedId === c.id;
          return (
            <Box key={c.id}>
              <ListItem
                divider
                button
                onClick={() => setExpandedId(expanded ? null : c.id)}
                secondaryAction={
                  <Stack direction="row">
                    <IconButton edge="end" onClick={(e) => { e.stopPropagation(); setEditing(c); }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton edge="end" onClick={(e) => { e.stopPropagation(); setDeletingId(c.id); }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                }
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: c.color }}>{c.icon}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={c.name}
                  secondary={`${items.length} transactions · ${formatCurrency(total)}`}
                />
              </ListItem>
              <Collapse in={expanded}>
                <Box sx={{ pl: 2, pr: 8, pb: 2 }}>
                  <RecentTransactions expenses={items} categories={categories} limit={20} />
                </Box>
              </Collapse>
            </Box>
          );
        })}
      </List>

      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 88, right: 24 }}
        onClick={() => setCreating(true)}
      >
        <AddIcon />
      </Fab>

      <CategoryEditDialog
        open={creating}
        onClose={() => setCreating(false)}
        onSave={async (name, icon, color) => {
          await categoriesApi.create(name, icon, color);
          setCreating(false);
        }}
      />

      {editing && (
        <CategoryEditDialog
          open
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={async (name, icon, color) => {
            await categoriesApi.update({ ...editing, name, icon, color });
            setEditing(null);
          }}
        />
      )}

      <ConfirmDialog
        open={!!deletingId}
        title="Delete category?"
        message="Existing transactions keep this category's name, but it will no longer appear as an option for new expenses."
        confirmLabel="Delete"
        destructive
        onCancel={() => setDeletingId(null)}
        onConfirm={async () => {
          if (deletingId) await categoriesApi.delete(deletingId);
          setDeletingId(null);
        }}
      />
    </Box>
  );
}

function CategoryEditDialog({
  open,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  initial?: Category;
  onClose: () => void;
  onSave: (name: string, icon: string, color: string) => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [icon, setIcon] = useState(initial?.icon ?? EMOJI_CHOICES[0]);
  const [color, setColor] = useState(initial?.color ?? COLOR_CHOICES[0]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{initial ? 'Edit category' : 'New category'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
          <Box>
            <Typography variant="caption" color="text.secondary">Icon</Typography>
            <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 0.5 }}>
              {EMOJI_CHOICES.map((e) => (
                <Avatar
                  key={e}
                  onClick={() => setIcon(e)}
                  sx={{ cursor: 'pointer', border: icon === e ? '2px solid' : 'none', borderColor: 'primary.main' }}
                >
                  {e}
                </Avatar>
              ))}
            </Stack>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Color</Typography>
            <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 0.5 }}>
              {COLOR_CHOICES.map((c) => (
                <Box
                  key={c}
                  onClick={() => setColor(c)}
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    bgcolor: c,
                    cursor: 'pointer',
                    border: color === c ? '3px solid black' : 'none',
                  }}
                />
              ))}
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button
          variant="contained"
          disabled={!name.trim()}
          onClick={() => onSave(name.trim(), icon, color)}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
