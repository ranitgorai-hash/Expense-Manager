import { useMemo, useState } from 'react';
import { Box, Stack, TextField, MenuItem, ToggleButtonGroup, ToggleButton, Typography } from '@mui/material';
import { useApp } from '../hooks/useApp';
import { useBudgetData } from '../hooks/useBudget';
import PageHeader from '../components/common/PageHeader';
import CategorySelector from '../components/expenses/CategorySelector';
import EmptyState from '../components/common/EmptyState';
import {
  filterByCategory,
  filterByDateRange,
  formatCurrency,
  formatDate,
  groupByDate,
  searchExpenses,
  sortExpenses,
  sumAmount,
} from '../utils';
import type { SortOrder } from '../types';

export default function HistoryPage() {
  const { visibleExpenses, categories, viewFilter, setViewFilter, mode } = useApp();
  const { tags } = useBudgetData();
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tagId, setTagId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('date-desc');

  const filtered = useMemo(() => {
    let result = visibleExpenses;
    result = searchExpenses(result, query);
    result = filterByCategory(result, categoryId || undefined);
    if (tagId) result = result.filter((e) => (e.tagIds ?? []).includes(tagId));
    result = filterByDateRange(result, from || undefined, to || undefined);
    result = sortExpenses(result, sortOrder);
    return result;
  }, [visibleExpenses, query, categoryId, tagId, from, to, sortOrder]);

  const grouped = groupByDate(filtered);
  const catFor = (id: string) => categories.find((c) => c.id === id);

  return (
    <Box>
      <PageHeader title="History" subtitle={`${filtered.length} transactions · ${formatCurrency(sumAmount(filtered))}`} />

      {mode === 'group' && (
        <ToggleButtonGroup
          size="small"
          exclusive
          value={viewFilter}
          onChange={(_, v) => v && setViewFilter(v)}
          sx={{ mb: 2 }}
        >
          <ToggleButton value="combined">Combined</ToggleButton>
          <ToggleButton value="single">Single only</ToggleButton>
          <ToggleButton value="group">Group only</ToggleButton>
        </ToggleButtonGroup>
      )}

      <Stack spacing={2} sx={{ mb: 2 }}>
        <TextField label="Search" value={query} onChange={(e) => setQuery(e.target.value)} fullWidth />
        {mode === 'single' && tags.length > 0 && (
          <TextField select label="Tag" value={tagId} onChange={(e) => setTagId(e.target.value)} sx={{ minWidth: 180 }}>
            <MenuItem value="">All tags</MenuItem>
            {tags.map((t) => (
              <MenuItem key={t.id} value={t.id}>#{t.name}</MenuItem>
            ))}
          </TextField>
        )}
        <Stack direction="row" spacing={2}>
          <CategorySelector categories={categories} value={categoryId} onChange={setCategoryId} allowEmpty label="Category" />
          <TextField
            select
            label="Sort by"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as SortOrder)}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="date-desc">Newest first</MenuItem>
            <MenuItem value="date-asc">Oldest first</MenuItem>
            <MenuItem value="amount-desc">Amount: high to low</MenuItem>
            <MenuItem value="amount-asc">Amount: low to high</MenuItem>
          </TextField>
        </Stack>
        <Stack direction="row" spacing={2}>
          <TextField label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
          <TextField label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
        </Stack>
      </Stack>

      {grouped.length === 0 ? (
        <EmptyState icon="🔍" title="No matching transactions" />
      ) : (
        grouped.map(({ date, items }) => (
          <Box key={date} sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
              {formatDate(date)} · {formatCurrency(sumAmount(items))}
            </Typography>
            {items.map((e) => {
              const cat = catFor(e.categoryId);
              return (
                <Stack key={e.id} direction="row" justifyContent="space-between" sx={{ py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Box>
                    <Typography variant="body2">
                      {cat?.icon} {e.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {cat?.name} {e.mode === 'group' ? '· Group' : '· Single'}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontWeight: 700 }}>{formatCurrency(e.amount)}</Typography>
                </Stack>
              );
            })}
          </Box>
        ))
      )}
    </Box>
  );
}
