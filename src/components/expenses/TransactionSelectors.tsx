import { MenuItem, TextField, Stack, Typography } from '@mui/material';
import type { Friend } from '../../types';

/**
 * Implements the Group Mode rules from the spec:
 *  - If a friend paid, paidFor is forced to 'user' (no manual selection).
 *  - If the user paid, paidFor is chosen between 'user' and any friend.
 */
export default function TransactionSelectors({
  friends,
  paidBy,
  paidFor,
  onChange,
}: {
  friends: Friend[];
  paidBy: string;
  paidFor: string;
  onChange: (paidBy: string, paidFor: string) => void;
}) {
  const activeFriends = friends.filter((f) => f.active);

  const handlePaidByChange = (value: string) => {
    if (value === 'user') {
      // user paid -> let them pick paidFor (default to themselves)
      onChange(value, paidFor === '' ? 'user' : paidFor);
    } else {
      // a friend paid -> assume it was for the user, no manual selection
      onChange(value, 'user');
    }
  };

  return (
    <Stack spacing={2}>
      <TextField select fullWidth label="Paid by" value={paidBy} onChange={(e) => handlePaidByChange(e.target.value)}>
        <MenuItem value="user">You</MenuItem>
        {activeFriends.map((f) => (
          <MenuItem key={f.id} value={f.id}>
            {f.name}
          </MenuItem>
        ))}
      </TextField>

      {paidBy === 'user' ? (
        <TextField
          select
          fullWidth
          label="Paid for"
          value={paidFor}
          onChange={(e) => onChange(paidBy, e.target.value)}
        >
          <MenuItem value="user">Yourself</MenuItem>
          {activeFriends.map((f) => (
            <MenuItem key={f.id} value={f.id}>
              {f.name}
            </MenuItem>
          ))}
        </TextField>
      ) : (
        <Typography variant="body2" color="text.secondary">
          Since {activeFriends.find((f) => f.id === paidBy)?.name ?? 'your friend'} paid, this is
          assumed to be for you.
        </Typography>
      )}
    </Stack>
  );
}
