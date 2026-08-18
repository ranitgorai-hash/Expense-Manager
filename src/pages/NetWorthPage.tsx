import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useTheme } from '@mui/material/styles';
import { useBudgetData } from '../hooks/useBudget';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';
import { netWorthApi } from '../db';
import { formatCurrency, formatDate, todayIso } from '../utils';
import { chartTooltipStyle } from '../utils/theme';

export default function NetWorthPage() {
  const { netWorthSnapshots } = useBudgetData();
  const [adding, setAdding] = useState(false);
  const theme = useTheme();

  const sorted = [...netWorthSnapshots].sort((a, b) => a.date.localeCompare(b.date));
  const chartData = sorted.map((s) => ({
    date: s.date.slice(5),
    total: s.accounts.reduce((sum, a) => sum + a.balance, 0),
  }));

  return (
    <Box>
      <PageHeader title="Net Worth" subtitle="Optional manual snapshots, kept separate from expense tracking" />

      {sorted.length === 0 ? (
        <EmptyState icon="📈" title="No snapshots yet" subtitle="Record your account balances any time to see your net worth over time." />
      ) : (
        <>
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip contentStyle={chartTooltipStyle(theme.palette.mode)} formatter={(v) => formatCurrency(Number(v))} />
                  <Line type="monotone" dataKey="total" stroke={theme.palette.primary.main} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Stack spacing={1}>
            {sorted
              .slice()
              .reverse()
              .map((s) => (
                <Card key={s.id} variant="outlined">
                  <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle2">{formatDate(s.date)}</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {formatCurrency(s.accounts.reduce((sum, a) => sum + a.balance, 0))}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {s.accounts.map((a) => `${a.name}: ${formatCurrency(a.balance)}`).join(' · ')}
                      </Typography>
                    </Box>
                    <IconButton onClick={() => netWorthApi.delete(s.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </CardContent>
                </Card>
              ))}
          </Stack>
        </>
      )}

      <Fab color="primary" sx={{ position: 'fixed', bottom: 88, right: 24 }} onClick={() => setAdding(true)}>
        <AddIcon />
      </Fab>

      <AddSnapshotDialog open={adding} onClose={() => setAdding(false)} />
    </Box>
  );
}

function AddSnapshotDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [date, setDate] = useState(todayIso());
  const [accounts, setAccounts] = useState([{ name: 'Bank', balance: '' }, { name: 'Cash', balance: '' }]);

  const updateAccount = (i: number, field: 'name' | 'balance', value: string) => {
    setAccounts((prev) => prev.map((a, idx) => (idx === i ? { ...a, [field]: value } : a)));
  };

  const handleSave = async () => {
    const parsed = accounts
      .filter((a) => a.name.trim() && a.balance !== '')
      .map((a) => ({ name: a.name.trim(), balance: Number(a.balance) }));
    if (parsed.length === 0) return;
    await netWorthApi.create(date, parsed);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>New snapshot</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Date" type="date" fullWidth value={date} onChange={(e) => setDate(e.target.value)} InputLabelProps={{ shrink: true }} />
          {accounts.map((a, i) => (
            <Stack direction="row" spacing={1} key={i}>
              <TextField label="Account" value={a.name} onChange={(e) => updateAccount(i, 'name', e.target.value)} sx={{ flex: 1 }} />
              <TextField label="Balance" type="number" value={a.balance} onChange={(e) => updateAccount(i, 'balance', e.target.value)} sx={{ flex: 1 }} />
            </Stack>
          ))}
          <Button size="small" onClick={() => setAccounts((prev) => [...prev, { name: '', balance: '' }])}>
            + Add another account
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button variant="contained" onClick={handleSave}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}
