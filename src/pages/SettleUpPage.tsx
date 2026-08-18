import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useApp } from '../hooks/useApp';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';
import { settlementsApi } from '../db';
import { calculateFriendBalance, formatCurrency, formatDate, todayIso } from '../utils';

export default function SettleUpPage() {
  const { friends, visibleExpenses, settlements } = useApp();
  const [params] = useSearchParams();
  const preselected = params.get('friend');
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(preselected);
  const [recording, setRecording] = useState(false);

  const activeFriends = friends.filter((f) => f.active);

  if (activeFriends.length === 0) {
    return (
      <Box>
        <PageHeader title="Settle Up" />
        <EmptyState icon="🤝" title="No friends to settle with" subtitle="Add an active friend first." />
      </Box>
    );
  }

  const selected = activeFriends.find((f) => f.id === selectedFriendId) ?? activeFriends[0];
  const balance = calculateFriendBalance(selected.id, visibleExpenses, settlements);
  const friendSettlements = settlements
    .filter((s) => s.friendId === selected.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Box>
      <PageHeader title="Settle Up" />

      <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mb: 2 }}>
        {activeFriends.map((f) => (
          <Button
            key={f.id}
            size="small"
            variant={f.id === selected.id ? 'contained' : 'outlined'}
            onClick={() => setSelectedFriendId(f.id)}
          >
            {f.name}
          </Button>
        ))}
      </Stack>

      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            Balance with {selected.name}
          </Typography>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: balance > 0 ? 'success.main' : balance < 0 ? 'error.main' : 'text.primary' }}
          >
            {balance === 0
              ? 'Settled up'
              : balance > 0
              ? `Owes you ${formatCurrency(balance)}`
              : `You owe ${formatCurrency(-balance)}`}
          </Typography>
          <Button sx={{ mt: 2 }} variant="contained" onClick={() => setRecording(true)}>
            Record a settlement
          </Button>
        </CardContent>
      </Card>

      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        Settlement history
      </Typography>
      {friendSettlements.length === 0 ? (
        <EmptyState title="No settlements recorded yet" />
      ) : (
        <List disablePadding>
          {friendSettlements.map((s) => (
            <ListItem
              key={s.id}
              divider
              secondaryAction={
                <IconButton edge="end" onClick={() => settlementsApi.delete(s.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              }
            >
              <ListItemText
                primary={`${s.amount > 0 ? '+' : ''}${formatCurrency(s.amount)}${s.note ? ` · ${s.note}` : ''}`}
                secondary={formatDate(s.date)}
              />
            </ListItem>
          ))}
        </List>
      )}

      <RecordSettlementDialog
        open={recording}
        friendName={selected.name}
        onClose={() => setRecording(false)}
        onSave={async (amount, note) => {
          await settlementsApi.create(selected.id, amount, note, todayIso());
          setRecording(false);
        }}
      />
    </Box>
  );
}

function RecordSettlementDialog({
  open,
  friendName,
  onClose,
  onSave,
}: {
  open: boolean;
  friendName: string;
  onClose: () => void;
  onSave: (amount: number, note?: string) => void;
}) {
  const [direction, setDirection] = useState<'they-paid' | 'i-paid'>('they-paid');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const handleSave = () => {
    const n = Number(amount);
    if (!n || n <= 0) return;
    // Convention: settlement.amount positive reduces "friend owes user" (i.e. friend paid user back).
    const signed = direction === 'they-paid' ? n : -n;
    onSave(signed, note.trim() || undefined);
    setAmount('');
    setNote('');
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Record settlement with {friendName}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Stack direction="row" gap={1}>
            <Button
              fullWidth
              variant={direction === 'they-paid' ? 'contained' : 'outlined'}
              onClick={() => setDirection('they-paid')}
            >
              They paid you
            </Button>
            <Button
              fullWidth
              variant={direction === 'i-paid' ? 'contained' : 'outlined'}
              onClick={() => setDirection('i-paid')}
            >
              You paid them
            </Button>
          </Stack>
          <TextField label="Amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} fullWidth />
          <TextField label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} fullWidth />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button variant="contained" onClick={handleSave}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}
