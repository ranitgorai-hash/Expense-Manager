import { Box, Card, CardContent, Typography, Stack, Chip } from '@mui/material';
import { useApp } from '../hooks/useApp';
import { useBudgetData } from '../hooks/useBudget';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';
import { generateInsights } from '../utils/insights';
import { calculateLoggingStreak } from '../utils';

export default function InsightsPage() {
  const { expenses, categories } = useApp();
  const { budgets } = useBudgetData();

  const insights = generateInsights(expenses, categories, budgets);
  const loggingStreak = calculateLoggingStreak(expenses);

  return (
    <Box>
      <PageHeader title="Insights" subtitle="Generated on-device from your data — nothing leaves your phone" />

      <Card variant="outlined" sx={{ mb: 3, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>{loggingStreak}</Typography>
              <Typography variant="body2">day{loggingStreak === 1 ? '' : 's'} logging streak</Typography>
            </Box>
            <Typography variant="h3">🔥</Typography>
          </Stack>
        </CardContent>
      </Card>

      {insights.length === 0 ? (
        <EmptyState icon="✨" title="Not enough data yet" subtitle="Keep logging expenses and insights will appear here." />
      ) : (
        <Stack spacing={1.5}>
          {insights.map((i) => (
            <Card key={i.id} variant="outlined">
              <CardContent>
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <Chip label={i.emoji} size="small" sx={{ fontSize: 16 }} />
                  <Typography variant="body2">{i.text}</Typography>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
}
