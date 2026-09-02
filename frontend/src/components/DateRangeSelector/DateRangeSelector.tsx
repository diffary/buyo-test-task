import { Box, Button, TextField } from "@mui/material";
import React from "react";

interface DateRangeSelectorProps {
  startDate: string;
  endDate: string;
  onStartChange: (val: string) => void;
  onEndChange: (val: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

const DateRangeSelector = ({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  onSubmit,
  loading,
}: DateRangeSelectorProps) => (
  <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
    <TextField
      type="date"
      size="small"
      label="С"
      InputLabelProps={{ shrink: true }}
      value={startDate}
      onChange={(e) => onStartChange(e.target.value)}
    />
    <TextField
      type="date"
      size="small"
      label="По"
      InputLabelProps={{ shrink: true }}
      value={endDate}
      onChange={(e) => onEndChange(e.target.value)}
    />
    <Button variant="contained" onClick={onSubmit} disabled={loading}>Обновить</Button>
  </Box>
);

export default React.memo(DateRangeSelector);
