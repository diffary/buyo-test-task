// components/FiltersPopover.tsx
import {
  Box, Button, Checkbox, Divider, FormControlLabel, FormGroup, IconButton, Popover, Typography
} from "@mui/material";
import IndeterminateCheckBoxIcon from '@mui/icons-material/IndeterminateCheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import React from "react";

interface FiltersPopoverProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  buyers: string[];
  selectedBuyers: string[];
  selectedFlows: string[];
  selectedSites: string[];
  selectedStatuses: string[];
  selectedMarks: string[];
  withMonth: boolean;
  withLifetime: boolean;
  onToggleBuyer: (buyer: string) => void;
  onToggleFlow: (flow: string) => void;
  onToggleSite: (site: string) => void;
  onToggleStatus: (status: string) => void;
  onToggleMark: (status: string) => void;
  onToggleAllMarks: () => void;
  onToggleMonth: () => void;
  onToggleLifetime: () => void;
  onReset: () => void;
  onToggleAllBuyers: () => void;
  lifeTimeAccess: boolean | null;
}

const FiltersPopover = ({
  open,
  anchorEl,
  onClose,
  buyers,
  selectedBuyers,
  selectedFlows,
  selectedSites,
  selectedStatuses,
  selectedMarks,
  withMonth,
  withLifetime,
  onToggleBuyer,
  onToggleFlow,
  onToggleSite,
  onToggleStatus,
  onToggleMark,
  onToggleAllMarks,
  onToggleMonth,
  onToggleLifetime,
  onReset,
  onToggleAllBuyers,
  lifeTimeAccess,
}: FiltersPopoverProps) => {
  const allBuyersSelected = buyers.length > 0 && selectedBuyers.length === buyers.length;
  const allMarksSelected = selectedMarks.length === 8;

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
    >
      <Box display="flex" gap={2} flexDirection="column">
        <Box display="flex" gap={2} p={2}>
          <Box>
            <Box display="flex" alignItems="center" gap={1}>
              <IconButton onClick={onToggleAllBuyers} disableRipple sx={{ padding: 0 }}>
                {allBuyersSelected ? <IndeterminateCheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
              </IconButton>
              <Typography fontWeight={600}>Баеры</Typography>
            </Box>

            <Box height={300} marginLeft={0.5} overflow="auto">
              <FormGroup sx={{ "& .MuiFormControlLabel-root": { height: "28px" } }}>
                {buyers.map(buyer => (
                  <FormControlLabel
                    key={buyer}
                    control={<Checkbox size="small" disableRipple checked={selectedBuyers.includes(buyer)} onChange={() => onToggleBuyer(buyer)} />}
                    label={buyer}
                  />
                ))}
              </FormGroup>
            </Box>
          </Box>

          <Divider flexItem orientation="vertical" />

          <Box>
            <Box>
              <Typography fontWeight={600}>Потоки</Typography>
              <FormGroup sx={{ "& .MuiFormControlLabel-root": { height: "28px" } }}>
                {['Оффер', 'Каталог'].map(flow => (
                  <FormControlLabel
                    key={flow}
                    control={<Checkbox size="small" disableRipple checked={selectedFlows.includes(flow)} onChange={() => onToggleFlow(flow)} />}
                    label={flow}
                  />
                ))}
              </FormGroup>
            </Box>

            <Box>
              <Typography fontWeight={600}>Посадочная</Typography>
              <FormGroup sx={{ "& .MuiFormControlLabel-root": { height: "28px" } }}>
                {['Лендинг', 'BUYO'].map(site => (
                  <FormControlLabel
                    key={site}
                    control={<Checkbox size="small" disableRipple checked={selectedSites.includes(site)} onChange={() => onToggleSite(site)} />}
                    label={site}
                  />
                ))}
              </FormGroup>
            </Box>

            <Box>
              <Typography fontWeight={600}>Активность</Typography>
              <FormGroup sx={{ "& .MuiFormControlLabel-root": { height: "28px" } }}>
                {['✅', '🚫'].map(status => (
                  <FormControlLabel
                    key={status}
                    control={<Checkbox size="small" disableRipple checked={selectedStatuses.includes(status)} onChange={() => onToggleStatus(status)} />}
                    label={status}
                  />
                ))}
              </FormGroup>
            </Box>

            <Box>
              <Box display="flex" alignItems="center" gap={1} mx={-0.5}>
                <IconButton onClick={onToggleAllMarks} disableRipple sx={{ padding: 0 }}>
                  {allMarksSelected ? <IndeterminateCheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
                </IconButton>
                <Typography fontWeight={600}>Метки</Typography>
              </Box>
              <FormGroup sx={{ "& .MuiFormControlLabel-root": { height: "28px" } }}>
                {['', '📉', '🚚', '⚠️', '🆕', '❗️', '📦', '🚫'].map(mark => (
                  <FormControlLabel
                    key={mark}
                    control={<Checkbox size="small" disableRipple checked={selectedMarks.includes(mark)} onChange={() => onToggleMark(mark)} />}
                    label={mark}
                  />
                ))}
              </FormGroup>
            </Box>

            <Box>
              <Typography fontWeight={600}>Дополнительно</Typography>
              <FormGroup sx={{ "& .MuiFormControlLabel-root": { height: "28px" } }}>
                <FormControlLabel
                  control={<Checkbox size="small" disableRipple checked={withMonth} onChange={onToggleMonth} />}
                  label="Месяц"
                />
                {lifeTimeAccess && (
                  <FormControlLabel
                    control={<Checkbox size="small" disableRipple checked={withLifetime} onChange={onToggleLifetime} />}
                    label="Лайфтайм"
                  />
                  )
                }
              </FormGroup>
            </Box>
          </Box>
        </Box>

        <Box display="flex" p={1} justifyContent="space-between">
          <Button onClick={onReset}>Сбросить</Button>
          <Button onClick={onClose}>Закрыть</Button>
        </Box>
      </Box>

    </Popover>
  );
};

export default React.memo(FiltersPopover);
