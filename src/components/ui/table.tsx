import React from "react";
import { Platform, Pressable } from "react-native";
import { ScrollView, View, Text } from "@/tw";
import { TableColumn } from "@/type/super-admin/subscription";

function alignClass(align: TableColumn<any>["align"]) {
  if (align === "center") return "items-center";
  if (align === "right") return "items-end";
  return "items-start";
}

export function Table<Row>(props: {
  columns: Array<TableColumn<Row>>;
  rows: Row[];
  rowKey: (row: Row, index: number) => string;
  emptyText?: string;
  variant?: "boxed" | "divider";
  headerPaddingYClassName?: string;
  renderExpandedRow?: (row: Row, index: number) => React.ReactNode;
  isRowExpanded?: (row: Row, index: number) => boolean;
  hideExpandedTopBorder?: boolean;
  onRowPress?: (row: Row, index: number) => void;
  isRowPressDisabled?: (row: Row, index: number) => boolean;
}) {
  const {
    columns,
    rows,
    rowKey,
    emptyText = "No data.",
    variant = "boxed",
    headerPaddingYClassName = "py-4",
    renderExpandedRow,
    isRowExpanded,
    hideExpandedTopBorder = false,
    onRowPress,
    isRowPressDisabled,
  } = props;

  const minWidth = columns.reduce((sum, col) => sum + (col.width ?? 160), 0);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={Platform.OS === "web"}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <View style={{ width: "100%", minWidth }} className="w-full">
        <View
          className={
            variant === "divider"
              ? ""
              : "border border-slate-200 dark:border-neutral-800 rounded-xl overflow-hidden"
          }
        >
          <View
            className={
              variant === "divider"
                ? "flex-row border-b border-slate-200 dark:border-neutral-800"
                : "flex-row border-b border-slate-200 dark:border-neutral-800"
            }
          >
            {columns.map((col) => (
              <View
                key={col.key}
                style={{
                  width: col.width,
                  flexGrow: col.width ? 0 : col.flex ?? 1,
                  flexBasis: col.width ? undefined : 0,
                }}
                className={`px-3 ${headerPaddingYClassName} ${alignClass(col.align)}`}
              >
                <Text className="text-xs font-poppins-semibold text-textPrimary dark:text-darkTextPrimary">
                  {col.header}
                </Text>
              </View>
            ))}
          </View>

          {rows.length === 0 ? (
            <View className="px-4 py-4">
              <Text className="text-xs font-poppins text-textMuted dark:text-darkTextMuted">
                {emptyText}
              </Text>
            </View>
          ) : (
            rows.map((row, idx) => {
              const isLast = idx === rows.length - 1;
              const expanded = isRowExpanded ? isRowExpanded(row, idx) : false;
              const rowPressDisabled = isRowPressDisabled ? isRowPressDisabled(row, idx) : false;
              const rowDivider =
                isLast ? "" : "border-b border-slate-200 dark:border-neutral-800";
              return (
                <View key={rowKey(row, idx)} className={rowDivider}>
                  <Pressable
                    disabled={!onRowPress || rowPressDisabled}
                    onPress={() => onRowPress?.(row, idx)}
                  >
                    <View className="flex-row">
                      {columns.map((col) => {
                        const cell = col.render(row);
                        return (
                          <View
                            key={col.key}
                            style={{
                              width: col.width,
                              flexGrow: col.width ? 0 : col.flex ?? 1,
                              flexBasis: col.width ? undefined : 0,
                            }}
                            className={`px-3 py-3 ${alignClass(col.align)}`}
                          >
                            {typeof cell === "string" ? (
                              <Text className="text-xs font-poppins text-textSecondary dark:text-darkTextSecondary">
                                {cell}
                              </Text>
                            ) : (
                              cell
                            )}
                          </View>
                        );
                      })}
                    </View>
                  </Pressable>

                  {expanded && renderExpandedRow ? (
                    <View
                      className={
                        variant !== "divider" && !hideExpandedTopBorder
                          ? "border-t border-slate-200 dark:border-neutral-800 font-poppins"
                          : ""
                      }
                    >
                      {renderExpandedRow(row, idx)}
                    </View>
                  ) : null}
                </View>
              );
            })
          )}
        </View>
      </View>
    </ScrollView>
  );
}

export { TableColumn };

