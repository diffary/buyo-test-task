import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {
  Box,
  Button,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  CircularProgress,
  IconButton,
  TableSortLabel, TableFooter, Popover, FormControlLabel, Checkbox,
  FormGroup, Typography, Switch
} from "@mui/material";
import dayjs from "dayjs";
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import SettingsIcon from '@mui/icons-material/Settings';
import {useAppDispatch, useAppSelector} from "../../utils/store/hooks.ts";
import {getOffersTraffic} from "../../utils/API/offersAPI.ts";
import TrafficRow from "./TrafficRow/TrafficRow.tsx";
import FiltersPopover from "./FiltersPopover/FiltersPopover.tsx";
import DateRangeSelector from "../../components/DateRangeSelector/DateRangeSelector.tsx";
import {trafficColumns} from "./columns.ts";
import { useSort } from "../../utils/hooks/useSort.tsx";
import getValueByPath from "../../utils/getValueByPath.ts";
import {round, safeAvg, safePercentage} from "../../utils/math.ts";
import {toggleValue} from "../../utils/toggleValue.ts";
import usePersistToLocalStorage from "../../utils/hooks/usePersistToLocalStorage.tsx";

const Traffic = () => {
  const { user } = useAppSelector((state) => state.auth);

  const dispatch = useAppDispatch();
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const { sortBy, sortOrder, handleSort } = useSort<string>(JSON.parse(localStorage.getItem("trafficSortBy") || '"name"'),  JSON.parse(localStorage.getItem("trafficSortOrder") || '"asc"'));

  const [loading, setLoading] = useState(false);

  const [buyers, setBuyers] = useState<string[]>([]);
  const [data, setData] = useState<any[]>([]);
  const [exchangeRate, setExchangeRate] = useState<number>(0);

  const [startDate, setStartDate] = useState(() => {
    const saved = localStorage.getItem("trafficStartDate");
    return saved ? JSON.parse(saved) : dayjs().startOf("month").format("YYYY-MM-DD");
  });
  const [endDate, setEndDate] = useState(() => {
    const saved = localStorage.getItem("trafficEndDate");
    return saved ? JSON.parse(saved) : dayjs().format("YYYY-MM-DD");
  });
  const [withMonth, setWithMonth] = useState(() => JSON.parse(localStorage.getItem("trafficWithMonth") || "false"));
  const [withLifetime, setWithLifetime] = useState(() => JSON.parse(localStorage.getItem("trafficWithLifetime") || "false"));

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBuyers, setSelectedBuyers] = useState<string[]>(() => JSON.parse(localStorage.getItem("trafficSelectedBuyers") || "[]"));
  const [selectedFlows, setSelectedFlows] = useState<string[]>(() => JSON.parse(localStorage.getItem("trafficSelectedFlows") || '["Оффер", "Каталог"]'));
  const [selectedSites, setSelectedSites] = useState<string[]>(() => JSON.parse(localStorage.getItem("trafficSelectedSites") || '["Лендинг", "BUYO"]'));
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(() => JSON.parse(localStorage.getItem("trafficSelectedStatuses") || '["✅", "🚫"]'));
  const [selectedMarks, setSelectedMarks] = useState<string[]>(() => JSON.parse(localStorage.getItem("trafficSelectedMarks") || '["", "📉", "🚚", "⚠️", "🆕", "❗️", "📦", "🚫"]'));
  const [autoRefreshOnLoad, setAutoRefreshOnLoad] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem("trafficAutoRefreshOnLoad");
      return raw === null ? true : JSON.parse(raw);
    } catch {
      return true;
    }
  });

  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    () =>
      JSON.parse(localStorage.getItem("trafficVisibleColumns") || "null") ||
      trafficColumns.map(col => col.key)
  );
  const [visibleCount, setVisibleCount] = useState(35);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openPopover = Boolean(anchorEl);
  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleFilterClose = () => setAnchorEl(null);

  const [columnsAnchorEl, setColumnsAnchorEl] = useState<null | HTMLElement>(null);
  const openColumnsPopover = Boolean(columnsAnchorEl);
  const handleColumnsClick = (e: React.MouseEvent<HTMLElement>) => setColumnsAnchorEl(e.currentTarget);
  const handleColumnsClose = () => setColumnsAnchorEl(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    setVisibleCount(35);
  }, [
    data,
    sortBy,
    sortOrder,
    searchQuery,
    selectedBuyers,
    selectedFlows,
    selectedSites,
    selectedStatuses,
    visibleColumns
  ]);

  const fetchData = async () => {
    setLoading(true);
    const res = await dispatch(getOffersTraffic({ since: startDate, until: endDate, with_lifetime: withLifetime, with_month: withMonth }));

    if (res.success) {
      setExchangeRate(res.data.exchange_rate)
      setBuyers(res.data.buyer_ids)
      setData(res.data.data);

      if (selectedBuyers.length === 0) {
        setSelectedBuyers(res.data.buyer_ids)
      }

      const isMoreThanMonth = dayjs(endDate).isAfter(
        dayjs(startDate).add(1, "month"),
        "day"
      );

      if (!isMoreThanMonth) {
        localStorage.setItem("trafficOffersData", JSON.stringify(res.data));
      }
    }

    setLoading(false);
  };

  const visibleCols = useMemo(
    () => trafficColumns.filter(col =>
      !col.hideable || visibleColumns.includes(col.key)
    ),
    [trafficColumns, visibleColumns]
  );

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const valA = getValueByPath(a, sortBy);
      const valB = getValueByPath(b, sortBy);

      if (typeof valA === "string") {
        return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === "asc" ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
    });
  }, [data, sortBy, sortOrder]);

  const displayedData = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return sortedData.filter(row =>
      (row.name?.toLowerCase()?.includes(query) || row.offer_id?.includes(query)) &&
      selectedBuyers.includes(row.buyer_id) &&
      selectedFlows.includes(row.flow_type) &&
      selectedSites.includes(row.site_type) &&
      selectedStatuses.includes(row.status) &&
      (
        Array.isArray(row.marks)
          ? row.marks.every(m => selectedMarks.includes(m.symbol))
          : false
      )
    );
  }, [sortedData, searchQuery, selectedBuyers, selectedFlows, selectedSites, selectedStatuses, selectedMarks]);

  const summary = useMemo(() => {
    const result = displayedData.reduce(
      (acc, row) => {
        acc.all_count += row.first.all_count;
        acc.clean_count += row.first.clean_count;
        acc.approves_count += row.first.approves_count;
        acc.trash_count += row.first.trash_count;
        acc.approves_sum += row.first.approves_sum;
        acc.unprocessed_count += row.first.unprocessed_count;
        acc.preorder_count += row.first.preorder_count;
        acc.completed_count += row.first.completed_count;
        acc.spend += row.first.spend;
        acc.conversion += row.first.conversion;
        acc.campaigns += row.campaigns;
        acc.usd_median += row.first.usd_median;
        acc.link_clicks += row.first.link_clicks;
        if (row.first.cr_percentage > 0 && row.first.cr_percentage <= 20) {
          acc.cr_percentage += row.first.cr_percentage
          acc.cr_percentage_count += 1
        }
        if (row.first.usd_median > 0) {
          acc.usd_median_count += 1
        }
        return acc;
      },
      {
        all_count: 0, clean_count: 0, approves_count: 0, trash_count: 0, approves_sum: 0, unprocessed_count: 0, preorder_count: 0,
        completed_count: 0, link_clicks: 0, spend: 0, conversion: 0, campaigns: 0, usd_median: 0,
        cr_percentage: 0, cr_percentage_count: 0
      }
    );

    const approves_percentage = safePercentage(result.approves_count, result.all_count);
    const approves_median = safeAvg(result.approves_sum, result.approves_count);

    return {
      ...result,
      approves_percentage,
      approves_median,
      trash_percentage: safePercentage(result.trash_count, result.all_count),
      unprocessed_percentage: safePercentage(result.unprocessed_count, result.all_count),
      preorder_percentage: safePercentage(result.preorder_count, result.all_count),
      completed_percentage: safePercentage(result.completed_count, result.approves_count),
      cr_percentage: safeAvg(result.cr_percentage, result.cr_percentage_count),
      usd_median: round(approves_median * 1000 * exchangeRate),
      spend: round(result.spend),
      lead_price: result.conversion > 0 ? round(result.spend / result.conversion) : 0,
    };
  }, [displayedData]);

  const resetFilters = () => {
    setSelectedBuyers(buyers);
    setSelectedFlows(["Оффер", "Каталог"])
    setSelectedSites(["Лендинг", "BUYO"])
    setSelectedStatuses(["✅", "🚫"])
    setSelectedMarks(["", "📉", "🚚", "⚠️", "🆕", "❗️", "📦", "🚫"])
  };

  useEffect(() => {
    if (autoRefreshOnLoad) {
      fetchData();
    } else {
      const cached = localStorage.getItem("trafficOffersData");

      if (cached) {
        const data = JSON.parse(cached);
        setData(data.data);
        setBuyers(data.buyer_ids);
        setExchangeRate(data.exchange_rate)
      } else {
        fetchData();
      }
    }
  }, []);

  usePersistToLocalStorage("trafficSortBy", sortBy);
  usePersistToLocalStorage("trafficSortOrder", sortOrder);
  usePersistToLocalStorage("trafficStartDate", startDate);
  usePersistToLocalStorage("trafficEndDate", endDate);
  usePersistToLocalStorage("trafficVisibleColumns", visibleColumns);
  usePersistToLocalStorage("trafficSelectedBuyers", selectedBuyers);
  usePersistToLocalStorage("trafficSelectedFlows", selectedFlows);
  usePersistToLocalStorage("trafficSelectedSites", selectedSites);
  usePersistToLocalStorage("trafficSelectedStatuses", selectedStatuses);
  usePersistToLocalStorage("trafficSelectedMarks", selectedMarks);
  usePersistToLocalStorage("trafficWithMonth", withMonth);
  usePersistToLocalStorage("trafficWithLifetime", withLifetime);
  usePersistToLocalStorage("trafficAutoRefreshOnLoad", autoRefreshOnLoad);

  const onToggleRow = useCallback((id: string) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAllBuyers = () => {
    if (selectedBuyers.length === buyers.length) {
      setSelectedBuyers([]);
    } else {
      setSelectedBuyers(buyers);
    }
  };

  const ALL_MARKS = ['', '📉', '🚚', '⚠️', '🆕', '❗️', '📦', '🚫'];
  const toggleSelectAllMarks = () => {
    if (selectedMarks.length === ALL_MARKS.length) {
      setSelectedMarks([]);
    } else {
      setSelectedMarks(ALL_MARKS);
    }
  };

  const visibleData = useMemo(() => {
    return displayedData.slice(0, visibleCount);
  }, [displayedData, visibleCount]);

  useEffect(() => {
    const currentRef = loaderRef.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisibleCount(prev => {
          if (prev < displayedData.length) {
            return prev + 35;
          }
          return prev;
        });
      }
    });

    observer.observe(currentRef);

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [loaderRef.current, displayedData.length]);

  return (
    <Box id="portal-root">
      <Box my={2} display="flex" justifyContent="space-between">
        <Typography variant="h5" fontWeight={600}>Трафик</Typography>
        <Typography variant="body1">1 SUM = {exchangeRate} USD</Typography>
      </Box>

      <Box display="flex" mb={3} justifyContent="space-between">
        <Box display="flex" gap={2}>
          <DateRangeSelector
            startDate={startDate}
            endDate={endDate}
            onStartChange={setStartDate}
            onEndChange={setEndDate}
            onSubmit={fetchData}
            loading={loading}
          />
          <Box display="flex" gap={2} alignItems="center">
            <TextField
              type="search"
              size="small"
              label="Поиск"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: 250 }}
            />
            <IconButton onClick={handleFilterClick}><FilterAltIcon /></IconButton>
          </Box>
        </Box>

        <Box display="flex" gap={2}>
          <IconButton onClick={handleColumnsClick}><SettingsIcon /></IconButton>
        </Box>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" py={3}><CircularProgress /></Box>
      ) : (
        <Paper
          sx={{ maxHeight: "calc(100vh - 180px)", overflow: "auto", width: "100%" }}
          ref={scrollContainerRef}
        >
          <Box sx={{ minWidth: "max-content" }}>
            <Table
              size="small"
              sx={{
                borderCollapse: "separate",
                borderSpacing: 0,
                "& .MuiTableCell-root": {
                  padding: "4px 8px",
                  borderRight: "1px solid #e0e0e0",
                },
                "& .MuiTableCell-root:last-child": {
                  borderRight: "none",
                },
              }}
            >
              <TableHead sx={{
                position: 'sticky',
                top: 0,
                zIndex: 2,
                '& .MuiTableCell-root': {
                  verticalAlign: 'bottom',
                  borderBottom: 'none !important',
                },
              }}>
                <TableRow sx={{ "& td, & th": { fontWeight: 600, boxShadow: 'inset 0 -1px 0 #e0e0e0' } }}>
                  {visibleCols.map((col) => {
                    const isSortable = col.sortable;

                    return (
                      <TableCell
                        key={col.key}
                        onClick={isSortable ? () => handleSort(col.key) : undefined}
                        align={col.align}
                        sx={{
                          backgroundColor: col.color,
                          position: col.fixed ? "sticky" : "static",
                          left: col.fixed ? `${col.left}px` : undefined,
                          zIndex: col.fixed ? 3 : undefined,
                          width: col.width ?? undefined,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          fontWeight: 600,
                          cursor: isSortable ? "pointer" : "default",
                        }}
                      >
                        {isSortable ? (
                          <TableSortLabel
                            active={sortBy === col.key}
                            direction={sortBy === col.key ? sortOrder : "asc"}
                          >
                            {col.label}
                          </TableSortLabel>
                        ) : (
                          col.label
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableHead>

              <TableBody>
                {visibleData.map((row, i) => {
                    const id = `${row.offer_id}_${row.buyer_id}_${row.site_type}`;
                    const isSelected = selectedRows.has(id);

                    return (
                      <TrafficRow
                        id={id}
                        key={id}
                        startDate={startDate}
                        endDate={endDate}
                        row={row}
                        isWhiteRow={i % 2 === 0}
                        visibleColumns={visibleColumns}
                        isSelected={isSelected}
                        onToggleRow={onToggleRow}
                      />
                    )
                  }
                )}
                {visibleData.length < displayedData.length && (
                  <TableRow>
                    <TableCell colSpan={visibleCols.length}>
                      <Box ref={loaderRef} sx={{ py: 2, textAlign: 'center' }}>
                        <CircularProgress size={24} />
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>

              <TableFooter
                sx={{
                  position: 'sticky',
                  bottom: -0.2,
                  zIndex: 1,
                  '& .MuiTableCell-root': {
                    backgroundColor: '#fffedc',
                    fontSize: "0.875rem",
                    color: "black"
                  },
                }}
              >
                <TableRow sx={{ fontWeight: 600 }}>
                  <TableCell align="right" colSpan={4} sx={{ position: "sticky", left: 0, width: 700, zIndex: 2 }}>Итого</TableCell>
                  {visibleColumns.includes("offer_type") && <TableCell />}
                  <TableCell />
                  {visibleColumns.includes("status") && <TableCell />}
                  {visibleColumns.includes("marks") && <TableCell />}
                  {visibleColumns.includes("flow_type") && <TableCell />}
                  {visibleColumns.includes("column") && <TableCell />}
                  {visibleColumns.includes("inventory.quantity") && <TableCell />}
                  {visibleColumns.includes("first.all_count") && <TableCell>{summary.all_count}</TableCell>}
                  {visibleColumns.includes("first.clean_count") && <TableCell>{summary.clean_count}</TableCell>}
                  {visibleColumns.includes("first.approves_count") && <TableCell>{summary.approves_count}</TableCell>}
                  {visibleColumns.includes("first.trash_percentage") && <TableCell>{summary.trash_percentage}%</TableCell>}
                  {visibleColumns.includes("first.approves_percentage") && <TableCell>{summary.approves_percentage}%</TableCell>}
                  {visibleColumns.includes("first.unprocessed_percentage") && <TableCell>{summary.unprocessed_percentage}%</TableCell>}
                  {visibleColumns.includes("first.approves_median") && <TableCell>{summary.approves_median}</TableCell>}
                  {visibleColumns.includes("first.preorder_percentage") && <TableCell>{summary.preorder_percentage}%</TableCell>}
                  {visibleColumns.includes("first.completed_percentage") && <TableCell>{summary.completed_percentage}%</TableCell>}
                  {visibleColumns.includes("first.cr_percentage") && <TableCell>{summary.cr_percentage}%</TableCell>}
                  {visibleColumns.includes("first.spend") && <TableCell>{summary.spend}$</TableCell>}
                  {visibleColumns.includes("first.conversion") && <TableCell>{summary.conversion}</TableCell>}
                  {visibleColumns.includes("first.lead_price") && <TableCell>{summary.lead_price}$</TableCell>}
                  {visibleColumns.includes("campaigns") && <TableCell>{summary.campaigns}</TableCell>}
                  {visibleColumns.includes("first.usd_median") && <TableCell align="right">{summary.usd_median}$</TableCell>}
                </TableRow>
              </TableFooter>
            </Table>
          </Box>
        </Paper>
      )}

      <FiltersPopover
        open={openPopover}
        anchorEl={anchorEl}
        onClose={handleFilterClose}
        buyers={buyers}
        selectedBuyers={selectedBuyers}
        selectedFlows={selectedFlows}
        selectedSites={selectedSites}
        selectedStatuses={selectedStatuses}
        selectedMarks={selectedMarks}
        withMonth={withMonth}
        withLifetime={withLifetime}
        onToggleBuyer={(buyer: string) => toggleValue(buyer, setSelectedBuyers)}
        onToggleFlow={(flow: string) => toggleValue(flow, setSelectedFlows)}
        onToggleSite={(site: string) => toggleValue(site, setSelectedSites)}
        onToggleStatus={(status: string) => toggleValue(status, setSelectedStatuses)}
        onToggleMark={(status: string) => toggleValue(status, setSelectedMarks)}
        onToggleAllMarks={toggleSelectAllMarks}
        onToggleMonth={() => setWithMonth(!withMonth)}
        onToggleLifetime={() => setWithLifetime(!withLifetime)}
        onReset={resetFilters}
        onToggleAllBuyers={toggleSelectAllBuyers}
        lifeTimeAccess={user && user.role === "admin"}
      />

      <Popover
        open={openColumnsPopover}
        anchorEl={columnsAnchorEl}
        onClose={handleColumnsClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Box sx={{ maxWidth: 300 }}>
          <Box p={2} display="flex" flexDirection="column" gap={1}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography fontWeight={600}>
                Обновление при открытии:
              </Typography>
              <Switch
                size="small"
                checked={autoRefreshOnLoad}
                onChange={(e) => setAutoRefreshOnLoad(e.target.checked)}
              />
            </Box>

            <Box display="flex" flexDirection="column">
              <Typography fontWeight={600}>Настройки колонок: </Typography>

              <Box sx={{ height: 350, overflow: "auto" }}>
                <FormGroup sx={{ "& .MuiFormControlLabel-root": { height: "28px" } }}>
                  {trafficColumns.filter(col => col.hideable).map(col => (
                    <FormControlLabel
                      key={col.key}
                      control={
                        <Checkbox
                          size="small"
                          disableRipple
                          checked={visibleColumns.includes(col.key)}
                          onChange={() => toggleValue(col.key, setVisibleColumns)}
                        />
                      }
                      label={col.label}
                    />
                  ))}
                </FormGroup>
              </Box>
            </Box>

            <Box display="flex" justifyContent="space-between">
              <Button onClick={() => setVisibleColumns([])}>Убрать все</Button>
              <Button onClick={() => setVisibleColumns(trafficColumns.map(c => c.key))}>Сбросить</Button>
            </Box>
          </Box>
        </Box>
      </Popover>
    </Box>
  );
};

export default Traffic;
