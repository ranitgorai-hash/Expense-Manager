import { Box, Stack, Button, Card, CardContent, Typography, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import { useBudgetData } from '../hooks/useBudget';
import PageHeader from '../components/common/PageHeader';
import DashboardStats from '../components/dashboard/DashboardStats';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import BudgetProgressBar from '../components/budget/BudgetProgressBar';
import { calculateAllBalances, calculateLoggingStreak, monthKey, sumAmount, todayIso } from '../utils';
import { generateInsights } from '../utils/insights';
import { upcomingWithinDays, daysUntil } from '../utils/recurring';

export default function DashboardPage() {
  const { visibleExpenses, expenses, categories, friends, settlements, mode } = useApp();
  const { budgets, savingsGoals, recurringExpenses } = useBudgetData();
  const navigate = useNavigate();

  const thisMonth = monthKey(todayIso());
  const totalThisMonth = sumAmount(visibleExpenses.filter((e) => monthKey(e.date) === thisMonth));
  const totalToday = sumAmount(visibleExpenses.filter((e) => e.date === todayIso()));

  const balances = calculateAllBalances(friends, visibleExpenses, settlements);
  const netBalance = [...balances.values()].reduce((a, b) => a + b, 0);

  const singleThisMonth = expenses.filter((e) => e.mode === 'single' && monthKey(e.date) === thisMonth);
  const insights = mode === 'single' ? generateInsights(expenses, categories, budgets).slice(0, 2) : [];
  const streak = mode === 'single' ? calculateLoggingStreak(expenses) : 0;
  const upcomingRecurring = mode === 'single' ? upcomingWithinDays(recurringExpenses, 7) : [];

  return (
    <Box>
      <PageHeader
        title="Dashboard"
        subtitle={mode === 'group' ? 'Group Mode' : 'Single Mode'}
        action={
          <Button variant="contained" onClick={() => navigate('/add')}>
            + Add Expense
          </Button>
        }
      />

      <DashboardStats
        totalThisMonth={totalThisMonth}
        totalToday={totalToday}
        transactionCount={visibleExpenses.length}
        netBalance={netBalance}
        showNetBalance={mode === 'group'}
      />

      {mode === 'single' && (
        <>
          {streak > 0 && (
            <Card variant="outlined" sx={{ mt: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5 }}>
                <Typography variant="body2">🔥 {streak}-day logging streak</Typography>
                <Button size="small" color="inherit" onClick={() => navigate('/insights')}>View insights</Button>
              </CardContent>
            </Card>
          )}

          {budgets.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <PageHeader title="Budgets" action={<Button size="small" onClick={() => navigate('/budgets')}>Manage</Button>} />
              <Stack spacing={1.5}>
                {budgets.slice(0, 3).map((b) => {
                  const spent =
                    b.categoryId === 'overall'
                      ? sumAmount(singleThisMonth)
                      : sumAmount(singleThisMonth.filter((e) => e.categoryId === b.categoryId));
                  const cat = categories.find((c) => c.id === b.categoryId);
                  return (
                    <BudgetProgressBar
                      key={b.id}
                      spent={spent}
                      limit={b.monthlyLimit}
                      label={cat ? `${cat.icon} ${cat.name}` : 'Overall'}
                    />
                  );
                })}
              </Stack>
            </Box>
          )}

          {savingsGoals.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <PageHeader title="Savings Goals" action={<Button size="small" onClick={() => navigate('/goals')}>View all</Button>} />
              <Stack direction="row" gap={1} flexWrap="wrap">
                {savingsGoals.slice(0, 3).map((g) => (
                  <Chip
                    key={g.id}
                    label={`${g.icon} ${g.name} · ${Math.round((g.currentAmount / g.targetAmount) * 100)}%`}
                    onClick={() => navigate('/goals')}
                  />
                ))}
              </Stack>
            </Box>
          )}

          {upcomingRecurring.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <PageHeader title="Due soon" action={<Button size="small" onClick={() => navigate('/recurring')}>View all</Button>} />
              <Stack spacing={1}>
                {upcomingRecurring.slice(0, 3).map((re) => {
                  const d = daysUntil(re.nextDueDate);
                  return (
                    <Chip
                      key={re.id}
                      label={`${re.name} — ${d === 0 ? 'today' : d < 0 ? `${-d}d overdue` : `in ${d}d`}`}
                      color={d <= 0 ? 'warning' : 'default'}
                      variant="outlined"
                    />
                  );
                })}
              </Stack>
            </Box>
          )}

          {insights.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <PageHeader title="Insights" action={<Button size="small" onClick={() => navigate('/insights')}>View all</Button>} />
              <Stack spacing={1}>
                {insights.map((i) => (
                  <Card key={i.id} variant="outlined">
                    <CardContent sx={{ py: 1.5 }}>
                      <Typography variant="body2">{i.emoji} {i.text}</Typography>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Box>
          )}
        </>
      )}

      <Stack sx={{ mt: 3 }} spacing={1}>
        <PageHeader title="Recent transactions" />
        <RecentTransactions expenses={visibleExpenses} categories={categories} />
      </Stack>
    </Box>
  );
}
