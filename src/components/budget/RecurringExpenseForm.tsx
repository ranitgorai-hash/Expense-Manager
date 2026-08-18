import { useState } from 'react';
import { Stack, TextField, MenuItem, FormControlLabel, Switch, Button } from '@mui/material';
import CategorySelector from '../expenses/CategorySelector';
import type { Category, RecurringExpense, RecurringFrequency } from '../../types';
import { todayIso } from '../../utils';

export default function RecurringExpenseForm({
  categories,
  initial,
  onSubmit,
  submitLabel = 'Save',
}: {
  categories: Category[];
  initial?: Partial<RecurringExpense>;
  onSubmit: (value: Omit<RecurringExpense, 'id' | 'createdAt'>) => void;
  submitLabel?: string;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [amount, setAmount] = useState(initial?.amount ? String(initial.amount) : '');
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? categories[0]?.id ?? '');
  const [frequency, setFrequency] = useState<RecurringFrequency>(initial?.frequency ?? 'monthly');
  const [customDays, setCustomDays] = useState(initial?.customDays ? String(initial.customDays) : '30');
  const [nextDueDate, setNextDueDate] = useState(initial?.nextDueDate ?? todayIso());
  const [autoLog, setAutoLog] = useState(initial?.autoLog ?? false);

  const valid = name.trim() && Number(amount) > 0 && categoryId && nextDueDate;

  return (
    <Stack spacing={2}>
      <TextField label="Name" fullWidth value={name} onChange={(e) => setName(e.target.value)} />
      <TextField label="Amount" type="number" fullWidth value={amount} onChange={(e) => setAmount(e.target.value)} />
      <CategorySelector categories={categories} value={categoryId} onChange={setCategoryId} />
      <TextField select label="Frequency" fullWidth value={frequency} onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}>
        <MenuItem value="weekly">Weekly</MenuItem>
        <MenuItem value="monthly">Monthly</MenuItem>
        <MenuItem value="custom-days">Custom (every N days)</MenuItem>
      </TextField>
      {frequency === 'custom-days' && (
        <TextField label="Every N days" type="number" fullWidth value={customDays} onChange={(e) => setCustomDays(e.target.value)} />
      )}
      <TextField
        label="Next due date"
        type="date"
        fullWidth
        value={nextDueDate}
        onChange={(e) => setNextDueDate(e.target.value)}
        InputLabelProps={{ shrink: true }}
      />
      <FormControlLabel
        control={<Switch checked={autoLog} onChange={(e) => setAutoLog(e.target.checked)} />}
        label={autoLog ? 'Auto-log on due date' : 'Just remind me'}
      />
      <Button
        variant="contained"
        disabled={!valid}
        onClick={() =>
          onSubmit({
            name: name.trim(),
            amount: Number(amount),
            categoryId,
            frequency,
            customDays: frequency === 'custom-days' ? Number(customDays) : undefined,
            nextDueDate,
            autoLog,
            active: true,
          })
        }
      >
        {submitLabel}
      </Button>
    </Stack>
  );
}
