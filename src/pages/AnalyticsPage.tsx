import { useMemo } from 'react';
import { Box, Card, CardContent, Typography, Grid, useTheme } from '@mui/material';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { useApp } from '../hooks/useApp';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';
import { chartTooltipStyle, CHART_COLORS } from '../utils/theme';
import { formatCurrency, lastNMonths, monthKey, sumAmount, todayIso } from '../utils';

export default function AnalyticsPage() {
  const { visibleExpenses, categories } = useApp();
  const theme = useTheme();
  const tooltipStyle = chartTooltipStyle(theme.palette.mode);

  const monthlyTrend = useMemo(() => {
    const months = lastNMonths(6);
    return months.map((m) => ({
      month: m.slice(5) + '/' + m.slice(2, 4),
      total: sumAmount(visibleExpenses.filter((e) => monthKey(e.date) === m)),
    }));
  }, [visibleExpenses]);

  const dailyThisMonth = useMemo(() => {
    const thisMonth = monthKey(todayIso());
    const daysInMonth = new Date(Number(thisMonth.slice(0, 4)), Number(thisMonth.slice(5, 7)), 0).getDate();
    const arr = Array.from({ length: daysInMonth }, (_, i) => ({ day: String(i + 1), total: 0 }));
    for (const e of visibleExpenses) {
      if (monthKey(e.date) === thisMonth) {
        const day = Number(e.date.slice(8, 10));
        arr[day - 1].total += e.amount;
      }
    }
    return arr;
  }, [visibleExpenses]);

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of visibleExpenses) {
      map.set(e.categoryId, (map.get(e.categoryId) ?? 0) + e.amount);
    }
    return [...map.entries()]
      .map(([categoryId, total]) => {
        const cat = categories.find((c) => c.id === categoryId);
        return { name: cat?.name ?? 'Other', total: Math.round(total * 100) / 100, color: cat?.color };
      })
      .sort((a, b) => b.total - a.total);
  }, [visibleExpenses, categories]);

  const top5 = categoryBreakdown.slice(0, 5);

  if (visibleExpenses.length === 0) {
    return (
      <Box>
        <PageHeader title="Analytics" />
        <EmptyState icon="📊" title="Not enough data yet" subtitle="Log a few expenses to see your analytics." />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader title="Analytics" />
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Monthly spending (last 6 months)</Typography>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(Number(v))} />
                  <Line type="monotone" dataKey="total" stroke={theme.palette.primary.main} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Daily spending this month</Typography>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dailyThisMonth}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="day" fontSize={10} interval={2} />
                  <YAxis fontSize={12} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(Number(v))} />
                  <Bar dataKey="total" fill={theme.palette.secondary.main} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Category breakdown</Typography>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={categoryBreakdown} dataKey="total" nameKey="name" innerRadius={50} outerRadius={90}>
                    {categoryBreakdown.map((entry, i) => (
                      <Cell key={entry.name} fill={entry.color ?? CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(Number(v))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Top 5 categories</Typography>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={top5} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis type="number" fontSize={12} />
                  <YAxis type="category" dataKey="name" fontSize={12} width={90} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(Number(v))} />
                  <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                    {top5.map((entry, i) => (
                      <Cell key={entry.name} fill={entry.color ?? CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
