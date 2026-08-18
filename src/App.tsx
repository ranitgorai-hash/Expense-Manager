import { useState, useMemo } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  CssBaseline,
  ThemeProvider,
  Container,
  Divider,
  CircularProgress,
  Button,
  useMediaQuery,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import HistoryIcon from '@mui/icons-material/History';
import BarChartIcon from '@mui/icons-material/BarChart';
import CategoryIcon from '@mui/icons-material/Category';
import GroupsIcon from '@mui/icons-material/Groups';
import HandshakeIcon from '@mui/icons-material/Handshake';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SettingsIcon from '@mui/icons-material/Settings';
import SavingsIcon from '@mui/icons-material/Savings';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import InsightsIcon from '@mui/icons-material/Insights';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

import { AppProvider, useApp } from './hooks/useApp';
import { TourProvider } from './hooks/useTour';
import { buildTheme } from './utils/theme';
import ModeSwitcher from './components/common/ModeSwitcher';
import PwaUpdatePrompt from './components/common/PwaUpdatePrompt';
import TourOverlay from './components/tour/TourOverlay';

import DashboardPage from './pages/DashboardPage';
import AddExpensePage from './pages/AddExpensePage';
import CategoriesPage from './pages/CategoriesPage';
import FriendsPage from './pages/FriendsPage';
import SettleUpPage from './pages/SettleUpPage';
import FriendHistoryPage from './pages/FriendHistoryPage';
import HistoryPage from './pages/HistoryPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import BudgetsPage from './pages/BudgetsPage';
import RecurringExpensesPage from './pages/RecurringExpensesPage';
import SavingsGoalsPage from './pages/SavingsGoalsPage';
import TagsPage from './pages/TagsPage';
import InsightsPage from './pages/InsightsPage';
import NetWorthPage from './pages/NetWorthPage';

const SIDEBAR_WIDTH = 264;

function Shell() {
  const { loading, mode, settings } = useApp();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const theme = useMemo(() => buildTheme(settings?.darkMode ? 'dark' : 'light'), [settings?.darkMode]);
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const accent = mode === 'group' ? 'secondary.main' : 'primary.main';

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  const drawerItems = [
    { label: 'Dashboard', icon: <HomeIcon />, path: '/' },
    { label: 'History', icon: <HistoryIcon />, path: '/history' },
    { label: 'Analytics', icon: <BarChartIcon />, path: '/analytics' },
    { label: 'Categories', icon: <CategoryIcon />, path: '/categories' },
    ...(mode === 'group'
      ? [
          { label: 'Friends', icon: <GroupsIcon />, path: '/friends' },
          { label: 'Settle Up', icon: <HandshakeIcon />, path: '/settle-up' },
          { label: 'Friend History', icon: <ReceiptLongIcon />, path: '/friend-history' },
        ]
      : [
          { label: 'Budgets', icon: <SavingsIcon />, path: '/budgets' },
          { label: 'Recurring Expenses', icon: <AutorenewIcon />, path: '/recurring' },
          { label: 'Savings Goals', icon: <SavingsIcon />, path: '/goals' },
          { label: 'Tags', icon: <LocalOfferIcon />, path: '/tags' },
          { label: 'Insights', icon: <InsightsIcon />, path: '/insights' },
          { label: 'Net Worth', icon: <AccountBalanceIcon />, path: '/net-worth' },
        ]),
    { label: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  const bottomNavValue = location.pathname === '/' ? '/' : location.pathname;
  const currentPageLabel = drawerItems.find((i) => i.path === location.pathname)?.label
    ?? (location.pathname === '/add' ? 'Add Expense' : 'Expense Manager');

  const navList = (onNavigate?: () => void) => (
    <List sx={{ px: 1.5 }}>
      {drawerItems.map((item) => {
        const selected = location.pathname === item.path;
        return (
          <ListItemButton
            key={item.path}
            selected={selected}
            onClick={() => {
              navigate(item.path);
              onNavigate?.();
            }}
            sx={{
              borderRadius: 2,
              mb: 0.25,
              borderLeft: '3px solid',
              borderLeftColor: selected ? accent : 'transparent',
              bgcolor: selected ? 'action.selected' : 'transparent',
              '&.Mui-selected': { bgcolor: 'action.selected' },
              '&.Mui-selected:hover': { bgcolor: 'action.selected' },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: selected ? accent : 'text.secondary' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{ fontWeight: selected ? 700 : 500, fontSize: 14 }}
            />
          </ListItemButton>
        );
      })}
    </List>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        {isDesktop && (
          <Drawer
            variant="permanent"
            sx={{
              width: SIDEBAR_WIDTH,
              flexShrink: 0,
              '& .MuiDrawer-paper': {
                width: SIDEBAR_WIDTH,
                boxSizing: 'border-box',
                borderRight: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                backgroundImage: 'none',
              },
            }}
          >
            <Box sx={{ px: 2.5, pt: 2.5, pb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: accent, lineHeight: 1.2 }}>
                Expense Manager
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {mode === 'group' ? 'Group Mode' : 'Single Mode'}
              </Typography>
            </Box>
            <Box sx={{ px: 2.5, pb: 2 }}>
              <ModeSwitcher />
            </Box>
            <Box sx={{ px: 2.5, pb: 1 }}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<AddCircleIcon />}
                onClick={() => navigate('/add')}
              >
                Add Expense
              </Button>
            </Box>
            <Divider sx={{ mt: 1, mb: 1 }} />
            {navList()}
            <Box sx={{ mt: 'auto', px: 2.5, py: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Works fully offline · data stays on this device
              </Typography>
            </Box>
          </Drawer>
        )}

        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <AppBar
            position="sticky"
            color="default"
            elevation={0}
            sx={{ borderBottom: '1px solid', borderColor: 'divider', top: 0 }}
          >
            <Toolbar sx={{ gap: 1 }}>
              {!isDesktop && (
                <IconButton edge="start" onClick={() => setDrawerOpen(true)}>
                  <MenuIcon />
                </IconButton>
              )}
              <Typography
                variant={isDesktop ? 'subtitle2' : 'h6'}
                sx={{
                  flexGrow: 1,
                  fontWeight: isDesktop ? 600 : 800,
                  color: isDesktop ? 'text.secondary' : accent,
                }}
              >
                {isDesktop ? `${mode === 'group' ? 'Group Mode' : 'Single Mode'} / ${currentPageLabel}` : 'Expense Manager'}
              </Typography>
              {!isDesktop && <ModeSwitcher />}
            </Toolbar>
          </AppBar>

          {!isDesktop && (
            <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
              <Box sx={{ width: 260 }} role="presentation">
                <Typography variant="overline" sx={{ px: 2, pt: 2, display: 'block', color: 'text.secondary' }}>
                  {mode === 'group' ? 'Group Mode' : 'Single Mode'}
                </Typography>
                {navList(() => setDrawerOpen(false))}
                <Divider />
              </Box>
            </Drawer>
          )}

          <Container
            maxWidth={isDesktop ? 'md' : 'sm'}
            sx={{ flexGrow: 1, py: 3, pb: isDesktop ? 4 : 10, px: { xs: 2, md: 4 } }}
          >
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/add" element={<AddExpensePage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/friends" element={<FriendsPage />} />
              <Route path="/settle-up" element={<SettleUpPage />} />
              <Route path="/friend-history" element={<FriendHistoryPage />} />
              <Route path="/budgets" element={<BudgetsPage />} />
              <Route path="/recurring" element={<RecurringExpensesPage />} />
              <Route path="/goals" element={<SavingsGoalsPage />} />
              <Route path="/tags" element={<TagsPage />} />
              <Route path="/insights" element={<InsightsPage />} />
              <Route path="/net-worth" element={<NetWorthPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </Container>

          {!isDesktop && (
            <BottomNavigation
              value={bottomNavValue}
              onChange={(_, v) => navigate(v)}
              showLabels
              sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, borderTop: '1px solid', borderColor: 'divider' }}
            >
              <BottomNavigationAction label="Home" value="/" icon={<HomeIcon />} />
              <BottomNavigationAction label="History" value="/history" icon={<HistoryIcon />} />
              <BottomNavigationAction label="Add" value="/add" icon={<AddCircleIcon />} />
              <BottomNavigationAction label="Analytics" value="/analytics" icon={<BarChartIcon />} />
              {mode === 'group' ? (
                <BottomNavigationAction label="Friends" value="/friends" icon={<GroupsIcon />} />
              ) : (
                <BottomNavigationAction label="Budgets" value="/budgets" icon={<SavingsIcon />} />
              )}
            </BottomNavigation>
          )}
        </Box>

        <PwaUpdatePrompt />
        <TourOverlay />
      </Box>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <TourProvider>
          <Shell />
        </TourProvider>
      </HashRouter>
    </AppProvider>
  );
}
