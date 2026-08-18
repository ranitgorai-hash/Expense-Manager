import { Card, CardContent, Typography, Grid, Box } from '@mui/material';
import { formatCurrency } from '../../utils';

export default function DashboardStats({
  totalThisMonth,
  totalToday,
  transactionCount,
  netBalance,
  showNetBalance,
}: {
  totalThisMonth: number;
  totalToday: number;
  transactionCount: number;
  netBalance?: number;
  showNetBalance: boolean;
}) {
  const stats = [
    { label: 'This month', value: formatCurrency(totalThisMonth) },
    { label: 'Today', value: formatCurrency(totalToday) },
    { label: 'Transactions', value: String(transactionCount) },
  ];
  if (showNetBalance) {
    stats.push({
      label: 'Net balance',
      value: formatCurrency(netBalance ?? 0),
    });
  }

  return (
    <Grid container spacing={2}>
      {stats.map((s) => (
        <Grid item xs={6} sm={3} key={s.label}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                {s.label}
              </Typography>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {s.value}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
