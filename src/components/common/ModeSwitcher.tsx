import { ToggleButtonGroup, ToggleButton } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import GroupsIcon from '@mui/icons-material/Groups';
import { useApp } from '../../hooks/useApp';

export default function ModeSwitcher() {
  const { mode, setMode } = useApp();

  return (
    <ToggleButtonGroup
      size="small"
      exclusive
      value={mode}
      onChange={(_, v) => v && setMode(v)}
      sx={{
        bgcolor: 'background.paper',
        '& .MuiToggleButton-root': { px: 1.5, py: 0.5 },
      }}
    >
      <ToggleButton value="single">
        <PersonIcon fontSize="small" sx={{ mr: 0.5 }} /> Single
      </ToggleButton>
      <ToggleButton value="group">
        <GroupsIcon fontSize="small" sx={{ mr: 0.5 }} /> Group
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
