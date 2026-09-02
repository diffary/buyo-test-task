import React, {useMemo, useState} from "react";
import {
  Box,
  Checkbox,
  CircularProgress, FormControlLabel, FormGroup, IconButton,
  Modal,
  Paper,
  Table,
  TableBody,
  TableCell, TableFooter,
  TableHead,
  TableRow, TableSortLabel,
  Typography,
} from "@mui/material";
import { motion } from "framer-motion";
import {getOffersTrafficOffer} from "../../utils/API/offersAPI.ts";
import {useAppDispatch} from "../../utils/store/hooks.ts";
import {tagsColumns} from "./columns.ts";
import {useSort} from "../../utils/hooks/useSort.tsx";
import TagsRow from "./TagsRow/TagsRow.tsx";
import getValueByPath from "../../utils/getValueByPath.ts";
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import IndeterminateCheckBoxIcon from "@mui/icons-material/IndeterminateCheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import {round, safeAvg, safePercentage} from "../../utils/math.ts";

interface AggregatedOffer {
  medium: string;
  campaign: string;
  keyword: string;
  content: string;
  spend: number;
  conversion: number;
  price: string;
  orders: number;
  clean_orders: number;
  approves: number;
  unprocessed: number;
  trash: number;
  preorder: number;
  completed: number;
  percent_trash: number;
  percent_approve: number;
  avg_price: number;
  percent_preorder: number;
  percent_completed: number;
  lead_price: number;
  usd_median: number;
}

interface TagsCellProps {
  startDate: string;
  endDate: string;
  name: string;
  // Legacy props (still used by the old Traffic page)
  offer_id?: string;
  buyer_id?: string;
  site_type?: string;
  // New props for TrafficV2 dynamic groupBy
  groupBy?: string[];
  groupValues?: Record<string, string>;
}

const groupBy: Record<string, string>[] = [{key: "medium", name: "Канал"}, {key: "campaign", name: "Кампания"}, {key: "content", name: "Содержание"}, {key: "keyword", name: "Слово"}];

const TagsCell: React.FC<TagsCellProps> = ({
  startDate,
  endDate,
  name,
  offer_id,
  buyer_id,
  site_type,
  groupBy: groupByFields,
  groupValues,
}) => {
  const dispatch = useAppDispatch();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AggregatedOffer[]>([]);

  const { sortBy, sortOrder, handleSort } = useSort<string>("name");

  const [filterOptions, setFilterOptions] = useState<Partial<Record<string, string[]>>>({});
  const [activeFilters, setActiveFilters] = useState<Partial<Record<string, string[]>>>({});

  const [showFilters, setShowFilters] = useState(false);

  const handleOpen = () => {
    setOpen(true);
    if (data.length === 0) fetchData();
  };

  const handleClose = () => setOpen(false);

  const fetchData = async () => {
    setLoading(true);

    const effectiveGroupBy =
      groupByFields && groupByFields.length > 0
        ? groupByFields
        : ["offer_id", "buyer_id", "site_type"];

    const effectiveValues: Record<string, string> = groupValues
      ? { ...groupValues }
      : {
          offer_id: offer_id ?? "",
          buyer_id: buyer_id ?? "",
          site_type: site_type ?? "",
        };

    const res = await dispatch(
      getOffersTrafficOffer({
        since: startDate,
        until: endDate,
        group_by: effectiveGroupBy,
        ...effectiveValues,
      })
    );

    if (res.success) {
      const unique: Partial<Record<string, Set<string>>> = {};
      groupBy.forEach(field => unique[field.key] = new Set());
      res.data.forEach(item => groupBy.forEach(field => unique[field.key]?.add(item[field.key])));

      const result: Partial<Record<string, string[]>> = {};
      const initial: Partial<Record<string, string[]>> = {};

      groupBy.forEach(field => {
        const values = Array.from(unique[field.key]!);
        result[field.key] = values;
        if (!activeFilters[field.key]) initial[field.key] = values;
      });

      setFilterOptions(result);
      setActiveFilters(prev => ({ ...initial, ...prev }));
      setData(res.data);
    }

    setLoading(false);
  };

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
    return sortedData.filter(item =>
      groupBy.every(field =>
        (activeFilters[field.key]?.length ?? 0) === 0 ||
        activeFilters[field.key]?.includes(item[field.key])
      )
    );
  }, [sortedData, activeFilters]);

  const summary = useMemo(() => {
    const result = displayedData.reduce(
      (acc, row) => {
        acc.spend += row.spend;
        acc.conversion += row.conversion;
        acc.price += row.price;
        acc.orders += row.orders;
        acc.clean_orders += row.clean_orders;
        acc.approves += row.approves;
        acc.unprocessed += row.unprocessed;
        acc.trash += row.trash;
        acc.preorder += row.preorder;
        acc.completed += row.completed;
        acc.usd_median += row.usd_median;
        if (row.usd_median) {
          acc.usd_median_count += 1
        }
        return acc;
      },
      {
        spend: 0, conversion: 0, price: 0, orders: 0, clean_orders: 0, approves: 0, unprocessed: 0, trash: 0, preorder: 0, completed: 0,
        usd_median: 0, usd_median_count: 0
      }
    );

    const orders = result.orders || 1;
    const approves = result.approves || 1;
    const percent_approve = safePercentage(result.approves, orders);

    return {
      ...result,
      percent_approve: percent_approve,
      percent_unprocessed: safePercentage(result.unprocessed, orders),
      percent_trash: safePercentage(result.trash, orders),
      avg_price: safeAvg(result.price, approves),
      percent_preorder: safePercentage(result.preorder, orders),
      percent_completed: safePercentage(result.completed, approves),
      usd_median: safeAvg(result.usd_median, result.usd_median_count),
      lead_price: safeAvg(result.spend, result.conversion),
    };
  }, [displayedData]);

  const isAllSelected = (field: string) => {
    const options = filterOptions[field] ?? [];
    const selected = activeFilters[field] ?? [];
    return options.length > 0 && options.every(val => selected.includes(val));
  };

  const handleToggleAll = (field: string) => {
    const options = filterOptions[field] ?? [];
    const selected = activeFilters[field] ?? [];
    const allSelected = options.length > 0 && options.every(val => selected.includes(val));
    setActiveFilters(prev => ({
      ...prev,
      [field]: allSelected ? [] : [...options],
    }));
  };

  const toggleFilter = (key: string, value: string) => {
    setActiveFilters(prev => {
      const current = prev[key] ?? [];
      return {
        ...prev,
        [key]: current.includes(value)
          ? current.filter(v => v !== value)
          : [...current, value],
      };
    });
  };

  return (
    <Box>
      <span onClick={handleOpen} style={{ cursor: "pointer" }}>{name}</span>
      <Modal open={open} onClose={handleClose}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <Paper sx={{ m: "100px auto", p: 2, maxWidth: "95vw" }}>
            <Box display="flex" gap={1} justifyContent="center">
              <Typography align="center" variant="h6" gutterBottom>
                {name}
              </Typography>
              <IconButton
                size="small"
                onClick={() => setShowFilters(prev => !prev)}
                sx={{ alignSelf: "flex-start" }}
              >
                <FilterAltIcon />
              </IconButton>
            </Box>
            {loading ? (
              <Box display="flex" justifyContent="center" py={3}>
                <CircularProgress />
              </Box>
            ) : (
              <Box display="flex" flexDirection="column" gap={2}>
                {showFilters && (
                  <Box
                    display="flex"
                    maxWidth="fit-content"
                    p={2}
                    gap={2}
                    sx={{
                      borderRadius: 1,
                      boxShadow: 1
                    }}
                  >
                    {groupBy.map(field => {
                      return (
                        <Box key={field.key} mb={2}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <IconButton onClick={() => handleToggleAll(field.key)} disableRipple sx={{ padding: 0 }}>
                              {isAllSelected(field.key) ? <IndeterminateCheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
                            </IconButton>
                            <Typography fontWeight={600}>{field.name}</Typography>
                          </Box>

                          <Box height={190} overflow="auto" pl={0.5}>
                            <FormGroup sx={{ "& .MuiFormControlLabel-root": { height: "28px" } }}>
                              {(filterOptions[field.key] ?? []).map(value => (
                                <FormControlLabel
                                  key={value || "empty"}
                                  control={
                                    <Checkbox
                                      size="small"
                                      disableRipple
                                      checked={activeFilters[field.key]?.includes(value) ?? false}
                                      onChange={() => toggleFilter(field.key, value)}
                                    />
                                  }
                                  label={value || <span style={{ color: "#999", fontStyle: "italic" }}>пусто</span>}
                                />
                              ))}
                            </FormGroup>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                )}

                <Paper
                  sx={{ maxHeight: "calc(100vh - 500px)", overflow: "auto", width: "100%" }}
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
                      }}>
                        <TableRow sx={{ "& td, & th": { fontWeight: 600 } }}>
                          {tagsColumns.map((col) => {
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
                                  minWidth: col.width ?? "auto",
                                  maxWidth: col.width ?? "auto",
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
                        {displayedData.map((row, i) => (
                          <TagsRow
                            key={`${row.medium}_${row.campaign}_${row.keyword}_${row.content}`}
                            row={row}
                            isWhiteRow={i % 2 === 0}
                          />
                          )
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
                          <TableCell align="right" sx={{ position: "sticky", left: 0, width: 720, zIndex: 2 }} colSpan={4}>Итого</TableCell>
                          <TableCell></TableCell>
                          <TableCell>{summary.orders}</TableCell>
                          <TableCell>{summary.clean_orders}</TableCell>
                          <TableCell>{summary.approves}</TableCell>
                          <TableCell>{summary.percent_trash}%</TableCell>
                          <TableCell>{summary.percent_approve}%</TableCell>
                          <TableCell>{summary.percent_unprocessed}%</TableCell>
                          <TableCell>{summary.avg_price}</TableCell>
                          <TableCell>{summary.percent_preorder}%</TableCell>
                          <TableCell>{summary.percent_completed}%</TableCell>
                          <TableCell>{summary.spend.toFixed(2)}$</TableCell>
                          <TableCell>{summary.conversion}</TableCell>
                          <TableCell>{summary.lead_price}$</TableCell>
                          <TableCell align="right">{summary.usd_median}$</TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </Box>
                </Paper>
              </Box>
            )}
          </Paper>
        </motion.div>
      </Modal>
    </Box>
  );
};

export default TagsCell;
