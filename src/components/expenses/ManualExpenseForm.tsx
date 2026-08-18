import { useState } from 'react';
import { Stack, TextField, Button, Autocomplete, Chip, Box, Typography, FormControlLabel, Checkbox } from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CategorySelector from './CategorySelector';
import TransactionSelectors from './TransactionSelectors';
import type { Category, Friend, AppMode, Tag } from '../../types';
import { todayIso, nowTime } from '../../utils';

export interface ExpenseFormValue {
  name: string;
  amount: number;
  categoryId: string;
  date: string;
  time: string;
  notes?: string;
  paidBy?: string;
  paidFor?: string;
  tagIds?: string[];
  receiptFile?: File;
  saveAsQuickAdd?: boolean;
}

export default function ManualExpenseForm({
  mode,
  categories,
  friends,
  tags = [],
  initial,
  onSubmit,
  submitLabel = 'Add expense',
}: {
  mode: AppMode;
  categories: Category[];
  friends: Friend[];
  tags?: Tag[];
  initial?: Partial<ExpenseFormValue>;
  onSubmit: (value: ExpenseFormValue) => void;
  submitLabel?: string;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [amount, setAmount] = useState<string>(initial?.amount ? String(initial.amount) : '');
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? categories[0]?.id ?? '');
  const [date, setDate] = useState(initial?.date ?? todayIso());
  const [time, setTime] = useState(initial?.time ?? nowTime());
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [paidBy, setPaidBy] = useState(initial?.paidBy ?? 'user');
  const [paidFor, setPaidFor] = useState(initial?.paidFor ?? 'user');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initial?.tagIds ?? []);
  const [receiptFile, setReceiptFile] = useState<File | undefined>(undefined);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [saveAsQuickAdd, setSaveAsQuickAdd] = useState(false);

  const valid = name.trim().length > 0 && Number(amount) > 0 && categoryId;

  const handleSubmit = () => {
    if (!valid) return;
    onSubmit({
      name: name.trim(),
      amount: Number(amount),
      categoryId,
      date,
      time,
      notes: notes.trim() || undefined,
      ...(mode === 'group' ? { paidBy, paidFor } : {}),
      ...(mode === 'single' ? { tagIds: selectedTagIds, receiptFile } : {}),
      saveAsQuickAdd,
    });
  };

  return (
    <Stack spacing={2}>
      <TextField label="What was it for?" fullWidth value={name} onChange={(e) => setName(e.target.value)} />
      <TextField
        label="Amount"
        type="number"
        fullWidth
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        inputProps={{ min: 0, step: '0.01' }}
      />
      <CategorySelector categories={categories} value={categoryId} onChange={setCategoryId} />

      <Stack direction="row" spacing={2}>
        <TextField
          label="Date"
          type="date"
          fullWidth
          value={date}
          onChange={(e) => setDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="Time"
          type="time"
          fullWidth
          value={time}
          onChange={(e) => setTime(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </Stack>

      {mode === 'group' && (
        <TransactionSelectors
          friends={friends}
          paidBy={paidBy}
          paidFor={paidFor}
          onChange={(pb, pf) => {
            setPaidBy(pb);
            setPaidFor(pf);
          }}
        />
      )}

      {mode === 'single' && tags.length > 0 && (
        <Autocomplete
          multiple
          options={tags}
          getOptionLabel={(t) => t.name}
          value={tags.filter((t) => selectedTagIds.includes(t.id))}
          onChange={(_, val) => setSelectedTagIds(val.map((t) => t.id))}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip label={`#${option.name}`} size="small" {...getTagProps({ index })} key={option.id} />
            ))
          }
          renderInput={(params) => <TextField {...params} label="Tags (optional)" placeholder="#tag" />}
        />
      )}

      <TextField
        label="Notes (optional)"
        fullWidth
        multiline
        minRows={2}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <FormControlLabel
        control={<Checkbox checked={saveAsQuickAdd} onChange={(e) => setSaveAsQuickAdd(e.target.checked)} />}
        label="Save as a Quick Add shortcut"
      />

      {mode === 'single' && (
        <Box>
          <Button component="label" variant="outlined" startIcon={<PhotoCameraIcon />}>
            {receiptFile ? 'Change receipt photo' : 'Attach receipt photo (optional)'}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setReceiptFile(file);
                  setReceiptPreview(URL.createObjectURL(file));
                }
              }}
            />
          </Button>
          {receiptPreview && (
            <Box sx={{ mt: 1 }}>
              <img src={receiptPreview} alt="Receipt preview" style={{ maxWidth: 120, borderRadius: 8 }} />
              <Typography variant="caption" color="text.secondary" display="block">
                Stored locally only — never uploaded unless included in an encrypted Drive backup.
              </Typography>
            </Box>
          )}
        </Box>
      )}

      <Button variant="contained" size="large" disabled={!valid} onClick={handleSubmit}>
        {submitLabel}
      </Button>
    </Stack>
  );
}
