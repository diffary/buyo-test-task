import { memo } from "react";
import { TableRow, TableCell } from "@mui/material";

const TagsRow = ({
  row,
  isWhiteRow
}: {
  row: any;
  isWhiteRow: boolean;
}) => {
  const bg = (color: "green" | "blue" | "purple" | "default" = "default") =>
    isWhiteRow ? "white" : color;

  return (
    <TableRow className={isWhiteRow ? "whiteRow" : "defaultRow"}>
      <TableCell className={`${bg()} stickyLeft`} style={{ left: 0, width: 120 }}>{row.medium}</TableCell>
      <TableCell className={`${bg()} stickyLeft`} style={{ left: 120, width: 200 }}>{row.campaign}</TableCell>
      <TableCell className={`${bg()} stickyLeft`} style={{ left: 320, width: 200 }}>{row.content}</TableCell>
      <TableCell className={`${bg()} stickyLeft`} style={{ left: 520, width: 200 }}>{row.keyword}</TableCell>

      <TableCell className={bg()}>{row.status}</TableCell>
      <TableCell className={bg()}>{row.orders}</TableCell>
      <TableCell className={bg()}>{row.clean_orders}</TableCell>
      <TableCell className={bg("green")}>{row.approves}</TableCell>
      <TableCell className={bg("green")}>{row.percent_trash}%</TableCell>
      <TableCell className={bg("green")}>{row.percent_approve}%</TableCell>
      <TableCell className={bg("green")}>{row.percent_unprocessed}%</TableCell>
      <TableCell className={bg("green")}>{row.avg_price}</TableCell>
      <TableCell className={bg("green")}>{row.percent_preorder}%</TableCell>
      <TableCell className={bg("green")}>{row.percent_completed}%</TableCell>
      <TableCell className={bg("blue")}>{row.spend.toFixed(2)}$</TableCell>
      <TableCell className={bg("blue")}>{row.conversion}</TableCell>
      <TableCell className={bg("blue")}>{row.lead_price}$</TableCell>
      <TableCell align="right" className={bg("purple")}>{row.usd_median}$</TableCell>
    </TableRow>
  );
};

export default memo(TagsRow);
