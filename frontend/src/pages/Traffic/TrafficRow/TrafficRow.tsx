import { memo, useCallback } from "react";
import {TableRow, TableCell, Tooltip, Checkbox, Stack} from "@mui/material";
import TagsCell from "../../../components/TagsCell/TagsCell.tsx";
import {renderCRThreeFixed, renderThree, renderThreeFixed} from "../../../utils/math.ts";

const TrafficRow = ({
  id,
  row,
  startDate,
  endDate,
  isWhiteRow,
  visibleColumns,
  isSelected,
  onToggleRow,
}: {
  id: string;
  row: any;
  startDate: string;
  endDate: string;
  isWhiteRow: boolean;
  visibleColumns: string[];
  isSelected: boolean;
  onToggleRow: (row: any) => void;
}) => {
  const monthMinusColor = row.with_month_minus ? "red" : "default"
  const bg = (color: "selected" | "red" | "green" | "blue" | "purple" | "default" = "default") =>  isSelected ? "selected" : (isWhiteRow && color !== "red") ? "white" : color;
  const handleChange = useCallback(() => onToggleRow(id), [onToggleRow, id]);

  return (
    <TableRow className={isWhiteRow ? "whiteRow" : "defaultRow"}>
      <TableCell className={`${bg(monthMinusColor)} stickyLeft`} style={{ left: 0, width: 34 }}>
        <Checkbox
          className="row-checkbox"
          size="small"
          disableRipple
          checked={isSelected}
          onChange={handleChange}
        />
      </TableCell>
      <TableCell className={`${bg(monthMinusColor)} stickyLeft`} style={{ left: 34, width: 510 }}><TagsCell startDate={startDate} endDate={endDate} buyer_id={row.buyer_id} offer_id={row.offer_id} name={row.name} site_type={row.site_type} /></TableCell>
      <TableCell className={`${bg(monthMinusColor)} stickyLeft`} style={{ left: 544, width: 140 }}>{row.offer_id}</TableCell>
      <TableCell className={`${bg(monthMinusColor)} stickyLeft`} style={{ left: 684, width: 50 }}>{row.buyer_id}</TableCell>

      {visibleColumns.includes("offer_type") && <TableCell className={bg()}>{row.offer_type}</TableCell>}
      <TableCell className={bg()}>{row.site_type}</TableCell>
      {visibleColumns.includes("status") && <TableCell className={bg()}>{row.status}</TableCell>}
      {visibleColumns.includes("marks") && (
        <TableCell align="center" className={bg()}>
          {!!row.marks?.length && (
            <Stack
              direction="row"
              spacing={0.5}
              useFlexGap
              flexWrap="wrap"
              justifyContent="center"
            >
              {row.marks.map((m: { symbol: React.ReactNode; tip?: string; id?: string | number }, i: number) => {
                const content = <span>{m.symbol}</span>;
                return (
                  <Tooltip key={m.id ?? i} title={m.tip} arrow>
                    {content}
                  </Tooltip>
                )
              })}
            </Stack>
          )}
        </TableCell>
      )}
      {visibleColumns.includes("flow_type") && <TableCell className={bg()}>{row.flow_type}</TableCell>}

      {visibleColumns.includes("column") && (
        <TableCell className={bg()} style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <Tooltip title={row.column}>
            <a
              href={row.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'black',
                textDecoration: 'none',
              }}
            >
              {row.column}
            </a>
          </Tooltip>
        </TableCell>
      )}

      {visibleColumns.includes("inventory.quantity") && (
        <TableCell className={bg()}>
          <Tooltip
            title={row.inventory.offers_str ? <span style={{ whiteSpace: "pre-line" }}>{row.inventory.offers_str}</span> : "Не найдено"}
          >
            <span>{row.inventory?.quantity || 0}</span>
          </Tooltip>
        </TableCell>
      )}

      {visibleColumns.includes("first.all_count") && <TableCell className={bg()}>{renderThree(row.first.all_count, row.second.all_count, row.third?.all_count)}</TableCell>}
      {visibleColumns.includes("first.clean_count") && <TableCell className={bg()}>{renderThree(row.first.clean_count, row.second.clean_count, row.third?.clean_count)}</TableCell>}
      {visibleColumns.includes("first.approves_count") && <TableCell className={bg("green")}>{renderThree(row.first.approves_count, row.second.approves_count, row.third?.approves_count)}</TableCell>}
      {visibleColumns.includes("first.trash_percentage") && <TableCell className={bg("green")}>{renderThree(row.first.trash_percentage, row.second.trash_percentage, row.third?.trash_percentage, "%")}</TableCell>}
      {visibleColumns.includes("first.approves_percentage") && <TableCell className={bg("green")}>{renderThree(row.first.approves_percentage, row.second.approves_percentage, row.third?.approves_percentage, "%")}</TableCell>}
      {visibleColumns.includes("first.unprocessed_percentage") && <TableCell className={bg("green")}>{renderThree(row.first.unprocessed_percentage, row.second.unprocessed_leads, row.third?.unprocessed_leads, "%")}</TableCell>}
      {visibleColumns.includes("first.approves_median") && <TableCell className={bg("green")}>{renderThreeFixed(row.first.approves_median, row.second.approves_median, row.third?.approves_median)}</TableCell>}
      {visibleColumns.includes("first.preorder_percentage") && <TableCell className={bg("green")}>{renderThree(row.first.preorder_percentage, row.second.preorder_percentage, row.third?.preorder_percentage, "%")}</TableCell>}
      {visibleColumns.includes("first.completed_percentage") && <TableCell className={bg("green")}>{renderThree(row.first.completed_percentage, row.second.completed_percentage, row.third?.completed_percentage, "%")}</TableCell>}
      {visibleColumns.includes("first.cr_percentage") && <TableCell className={bg("orange")}>{renderCRThreeFixed(row.first.cr_percentage, row.first.link_clicks, row.second.cr_percentage, row.third.cr_percentage, "%")}</TableCell>}
      {visibleColumns.includes("first.spend") && <TableCell className={bg("blue")}>{renderThreeFixed(row.first.spend, row.second.spend, row.third?.spend, "$")}</TableCell>}
      {visibleColumns.includes("first.conversion") && <TableCell className={bg("blue")}>{renderThree(row.first.conversion, row.second.conversion, row.third?.conversion)}</TableCell>}
      {visibleColumns.includes("first.lead_price") && <TableCell className={bg("blue")}>{renderThreeFixed(row.first.lead_price, row.second.lead_price, row.third?.lead_price, "$")}</TableCell>}
      {visibleColumns.includes("campaigns") && <TableCell className={bg("blue")}>{row.campaigns}</TableCell>}
      {visibleColumns.includes("first.usd_median") && <TableCell align="right" className={bg("purple")}>{row.first.usd_median.toFixed(2)}$</TableCell>}
    </TableRow>
  );
};

export default memo(TrafficRow);
