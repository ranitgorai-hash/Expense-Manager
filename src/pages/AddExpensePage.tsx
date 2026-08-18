import { Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import { useBudgetData } from '../hooks/useBudget';
import PageHeader from '../components/common/PageHeader';
import QuickExpenseButtons from '../components/expenses/QuickExpenseButtons';
import ManualExpenseForm, { type ExpenseFormValue } from '../components/expenses/ManualExpenseForm';
import { expensesApi, receiptImagesApi, quickExpensesApi } from '../db';

export default function AddExpensePage() {
  const { mode, categories, friends, quickExpenses } = useApp();
  const { tags } = useBudgetData();
  const navigate = useNavigate();

  const handleQuickPick = async (qe: { name: string; amount: number; categoryId: string }) => {
    await expensesApi.create({
      mode,
      name: qe.name,
      amount: qe.amount,
      categoryId: qe.categoryId,
      date: new Date().toISOString().slice(0, 10),
      time: `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`,
      ...(mode === 'group' ? { paidBy: 'user', paidFor: 'user', confirmationStatus: 'none' } : {}),
    });
    navigate('/');
  };

  const handleSubmit = async (value: ExpenseFormValue) => {
    const created = await expensesApi.create({
      mode,
      name: value.name,
      amount: value.amount,
      categoryId: value.categoryId,
      date: value.date,
      time: value.time,
      notes: value.notes,
      ...(mode === 'group'
        ? { paidBy: value.paidBy, paidFor: value.paidFor, confirmationStatus: 'none' }
        : { tagIds: value.tagIds }),
    });
    if (mode === 'single' && value.receiptFile) {
      const img = await receiptImagesApi.save(created.id, value.receiptFile);
      await expensesApi.update({ ...created, receiptImageId: img.id });
    }
    if (value.saveAsQuickAdd) {
      await quickExpensesApi.create(value.name, value.amount, value.categoryId);
    }
    navigate('/');
  };

  return (
    <Box>
      <PageHeader title="Add Expense" subtitle={mode === 'group' ? 'Group Mode' : 'Single Mode'} />
      <QuickExpenseButtons quickExpenses={quickExpenses} categories={categories} onPick={handleQuickPick} />
      <ManualExpenseForm mode={mode} categories={categories} friends={friends} tags={tags} onSubmit={handleSubmit} />
    </Box>
  );
}
