import { Paper, Stack, Typography, Button, IconButton, LinearProgress, Chip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTour } from '../../hooks/useTour';

export default function TourOverlay() {
  const { active, tourMode, steps, stepIndex, currentStep, stepComplete, skip } = useTour();
  const navigate = useNavigate();
  const location = useLocation();

  if (!active || !currentStep) return null;

  const onTargetPage = location.pathname === currentStep.path;

  return (
    <Paper
      elevation={6}
      sx={{
        position: 'fixed',
        bottom: 72,
        left: 12,
        right: 12,
        maxWidth: 480,
        mx: 'auto',
        p: 2,
        borderRadius: 3,
        zIndex: 1300,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Chip
          size="small"
          label={`${tourMode === 'group' ? 'Group Mode' : 'Single Mode'} tour · Step ${stepIndex + 1} of ${steps.length}`}
          color="primary"
          variant="outlined"
        />
        <IconButton size="small" onClick={skip} aria-label="Skip tour">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>

      <Typography variant="subtitle1" sx={{ mt: 1, fontWeight: 700 }}>
        {stepComplete ? '✅ Nice!' : currentStep.title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        {stepComplete
          ? stepIndex < steps.length - 1
            ? 'Moving to the next step…'
            : "You're all set — wrapping up the tour…"
          : currentStep.description}
      </Typography>

      <LinearProgress
        variant="determinate"
        value={((stepIndex + (stepComplete ? 1 : 0)) / steps.length) * 100}
        sx={{ height: 6, borderRadius: 3, mb: 1.5 }}
      />

      {!stepComplete && !onTargetPage && (
        <Button variant="contained" size="small" onClick={() => navigate(currentStep.path)}>
          {currentStep.ctaLabel}
        </Button>
      )}
      {!stepComplete && onTargetPage && (
        <Stack direction="row" spacing={1} alignItems="center">
          <CheckCircleIcon fontSize="small" color="disabled" />
          <Typography variant="caption" color="text.secondary">
            You're on the right screen — go ahead and do it for real.
          </Typography>
        </Stack>
      )}
    </Paper>
  );
}
