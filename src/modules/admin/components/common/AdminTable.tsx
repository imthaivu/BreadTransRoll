/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { ReactNode } from "react";

export interface AdminTableColumn<T = any> {
  key: string;
  title: string;
  width?: string;
  render?: (value: any, record: T, index: number) => ReactNode;
  sortable?: boolean;
  className?: string;
}

export interface AdminTableProps<T = any> {
  columns: AdminTableColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  rowKey?: string | ((record: T) => string);
  onRowClick?: (record: T, index: number) => void;
  selectedRows?: string[];
  onSelectRow?: (record: T, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  showCheckbox?: boolean;
  className?: string;
}

export default function AdminTable<T = any>({
  columns,
  data,
  loading = false,
  emptyMessage = "Không có dữ liệu",
  rowKey = "id",
  onRowClick,
  selectedRows = [],
  onSelectRow,
  onSelectAll,
  showCheckbox = false,
  className = "",
}: AdminTableProps<T>) {
  const getRowKey = (record: T, index: number): string => {
    if (typeof rowKey === "function") {
      return rowKey(record);
    }
    return (record as any)[rowKey] || index.toString();
  };

  const isRowSelected = (record: T): boolean => {
    const key = getRowKey(record, 0);
    return selectedRows.includes(key);
  };

  const isAllSelected = (): boolean => {
    return data.length > 0 && selectedRows.length === data.length;
  };

  const isIndeterminate = (): boolean => {
    return selectedRows.length > 0 && selectedRows.length < data.length;
  };

  const handleRowClick = (record: T, index: number) => {
    if (onRowClick) {
      onRowClick(record, index);
    }
  };

  const handleSelectRow = (record: T, checked: boolean) => {
    if (onSelectRow) {
      onSelectRow(record, checked);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (onSelectAll) {
      onSelectAll(checked);
    }
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {showCheckbox && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary shadow-sm focus:ring-primary"
                    checked={isAllSelected()}
                    ref={(input) => {
                      if (input) input.indeterminate = isIndeterminate();
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.className || ""}`}
                  style={{ width: column.width }}
                >
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length + (showCheckbox ? 1 : 0)}
                  className="px-6 py-12 text-center"
                >
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2 text-gray-600">Đang tải...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (showCheckbox ? 1 : 0)}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((record, index) => (
                <motion.tr
                  key={getRowKey(record, index)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`hover:bg-gray-50 ${
                    onRowClick ? "cursor-pointer" : ""
                  }`}
                  onClick={() => handleRowClick(record, index)}
                >
                  {showCheckbox && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-primary shadow-sm focus:ring-primary"
                        checked={isRowSelected(record)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleSelectRow(record, e.target.checked);
                        }}
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-6 py-4 whitespace-nowrap text-sm md:text-base text-gray-900 ${column.className || ""}`}
                    >
                      {column.render
                        ? column.render(
                            (record as any)[column.key],
                            record,
                            index
                          )
                        : (record as any)[column.key]}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
