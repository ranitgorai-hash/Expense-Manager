import { MenuItem, TextField } from '@mui/material';
import type { Category } from '../../types';

export default function CategorySelector({
  categories,
  value,
  onChange,
  label = 'Category',
  allowEmpty = false,
}: {
  categories: Category[];
  value: string;
  onChange: (id: string) => void;
  label?: string;
  allowEmpty?: boolean;
}) {
  return (
    <TextField
      select
      fullWidth
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {allowEmpty && <MenuItem value="">All categories</MenuItem>}
      {categories.map((c) => (
        <MenuItem key={c.id} value={c.id}>
          {c.icon} {c.name}
        </MenuItem>
      ))}
    </TextField>
  );
}
