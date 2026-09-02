import { Box } from "@mui/material";

// Позиция риски "цена max" на шкале, % ширины. Справа от неё — зона перерасхода.
const MAX_TICK_POSITION = 80;

const COLORS = {
  green: "#2e9e44",
  yellow: "#ffb400",
  red: "#e53935",
};

const getIndicatorColor = (percentage: number) => {
  if (percentage < 80) return COLORS.green;
  if (percentage < 100) return COLORS.yellow;
  return COLORS.red;
};

const PriceFactMax = ({ fact, max, spend }: { fact?: number | null; max?: number; spend: number }) => {
  fact = fact ?? null;
  max = max ?? 0;

  // fact === null — апрувов нет: при наличии спенда это худший случай (красный у правого края)
  const percentage = fact === null
    ? (spend > 0 ? Infinity : 0)
    : max > 0 ? (fact / max) * 100 : (fact > 0 ? Infinity : 0);

  const dotColor = getIndicatorColor(percentage);
  const dotPosition = Math.min((percentage / 100) * MAX_TICK_POSITION, 97);

  return (
    <Box display="flex" alignItems="center" gap={1} sx={{ minWidth: 180 }}>
      <Box component="span" sx={{ whiteSpace: "nowrap", minWidth: 48 }}>
        {fact === null ? "—" : `${fact.toFixed(2)}$`}
      </Box>

      <Box sx={{ position: "relative", flexGrow: 1, minWidth: 56, height: 12 }}>
        <Box sx={{ position: "absolute", top: 5, left: 0, right: 0, height: "2px", backgroundColor: "#000" }} />
        <Box sx={{ position: "absolute", top: 1, left: `${MAX_TICK_POSITION}%`, width: "2px", height: 10, backgroundColor: "#000" }} />
        <Box
          sx={{
            position: "absolute",
            top: 2,
            left: `calc(${dotPosition}% - 4px)`,
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: dotColor,
          }}
        />
      </Box>

      <Box component="span" sx={{ whiteSpace: "nowrap", minWidth: 48, textAlign: "right" }}>
        {max.toFixed(2)}$
      </Box>
    </Box>
  );
};

export default PriceFactMax;
