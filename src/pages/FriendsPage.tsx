import { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Chip,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  Switch,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';
import { friendsApi } from '../db';
import { calculateAllBalances, formatCurrency } from '../utils';

export default function FriendsPage() {
  const { friends, visibleExpenses, settlements } = useApp();
  const [adding, setAdding] = useState(false);
  const navigate = useNavigate();

  const balances = calculateAllBalances(friends, visibleExpenses, settlements);

  return (
    <Box>
      <PageHeader title="Friends" />
      {friends.length === 0 ? (
        <EmptyState icon="🧑‍🤝‍🧑" title="No friends yet" subtitle="Add a friend to start splitting expenses." />
      ) : (
        <List disablePadding>
          {friends.map((f) => {
            const bal = balances.get(f.id) ?? 0;
            return (
              <ListItem
                key={f.id}
                divider
                button
                onClick={() => navigate(`/settle-up?friend=${f.id}`)}
                secondaryAction={
                  <Switch
                    checked={f.active}
                    onChange={(e) => friendsApi.setActive(f.id, e.target.checked)}
                    onClick={(e) => e.stopPropagation()}
                  />
                }
              >
                <ListItemAvatar>
                  <Avatar>{f.name.slice(0, 1).toUpperCase()}</Avatar>
                </ListItemAvatar>
                <ListItemText primary={f.name} secondary={f.email} />
                <Chip
                  sx={{ mr: 4 }}
                  size="small"
                  color={bal > 0 ? 'success' : bal < 0 ? 'error' : 'default'}
                  label={
                    bal === 0
                      ? 'Settled'
                      : bal > 0
                      ? `Owes you ${formatCurrency(bal)}`
                      : `You owe ${formatCurrency(-bal)}`
                  }
                />
              </ListItem>
            );
          })}
        </List>
      )}

      <Fab color="primary" sx={{ position: 'fixed', bottom: 88, right: 24 }} onClick={() => setAdding(true)}>
        <AddIcon />
      </Fab>

      <AddFriendDialog open={adding} onClose={() => setAdding(false)} />
    </Box>
  );
}

function AddFriendDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSave = async () => {
    if (!name.trim()) return;
    await friendsApi.create(name.trim(), email.trim() || undefined);
    setName('');
    setEmail('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Add friend</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth autoFocus />
          <TextField
            label="Email (optional, for collaborative confirmation)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button variant="contained" disabled={!name.trim()} onClick={handleSave}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}
