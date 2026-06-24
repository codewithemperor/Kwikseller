"use client";

import React from "react";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { FileSpreadsheet, Upload, X } from "lucide-react";
import {
  AppButton,
  AppModal,
  DataTable,
  ProgressBar,
  type ColumnDef,
} from "@kwikseller/ui";
import { vendorCommerceApi } from "@kwikseller/api-client";
import { kwikToast } from "@kwikseller/utils";
import { cn } from "@/lib/utils";

interface CsvRow {
  name: string;
  description?: string;
  category?: string;
  price: number;
  compare_price?: number;
  stock?: number;
  sku?: string;
  tags?: string;
  _errors?: string[];
}

export interface CsvImportModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CsvImportModal({ isOpen, onOpenChange, onSuccess }: CsvImportModalProps) {
  const [rows, setRows] = React.useState<CsvRow[]>([]);
  const [fileName, setFileName] = React.useState("");
  const [progress, setProgress] = React.useState(0);

  const onDrop = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, []);

  const handleFile = (file: File) => {
    if (!file.name.endsWith(".csv")) {
      kwikToast.error("Please upload a CSV file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      kwikToast.error("File too large (max 5MB)");
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      parseCsv(text);
    };
    reader.readAsText(file);
  };

  const parseCsv = (text: string) => {
    const lines = text.split("\n").filter((l) => l.trim());
    if (lines.length < 2) {
      kwikToast.error("CSV must have a header row + at least one data row");
      return;
    }
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const parsed: CsvRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim());
      const row: CsvRow = {
        name: cols[headers.indexOf("name")] ?? "",
        description: cols[headers.indexOf("description")] ?? "",
        category: cols[headers.indexOf("category")] ?? "",
        price: Number(cols[headers.indexOf("price")] ?? 0),
        compare_price: Number(cols[headers.indexOf("compare_price")] ?? 0) || undefined,
        stock: Number(cols[headers.indexOf("stock")] ?? 0) || 0,
        sku: cols[headers.indexOf("sku")] ?? "",
        tags: cols[headers.indexOf("tags")] ?? "",
      };
      const errors: string[] = [];
      if (!row.name) errors.push("Name required");
      if (!row.price || row.price <= 0) errors.push("Price must be > 0");
      row._errors = errors;
      parsed.push(row);
    }
    setRows(parsed);
  };

  const validRows = rows.filter((r) => (r._errors?.length ?? 0) === 0);
  const errorRows = rows.filter((r) => (r._errors?.length ?? 0) > 0);

  const importMutation = useMutation({
    mutationFn: async () => {
      const products = validRows.map((r) => ({
        name: r.name,
        description: r.description,
        category: r.category,
        price: r.price,
        comparePrice: r.compare_price,
        stock: r.stock,
        sku: r.sku,
        tags: r.tags,
      }));
      setProgress(10);
      const result = await vendorCommerceApi.bulkImportProducts(products);
      setProgress(100);
      return result;
    },
    onSuccess: (result: any) => {
      const created = result?.created ?? result?.data?.created ?? validRows.length;
      kwikToast.success(`Imported ${created} product(s) successfully`);
      onSuccess?.();
      onOpenChange(false);
      setRows([]);
      setFileName("");
      setProgress(0);
    },
    onError: (e: any) => {
      kwikToast.error(e?.message ?? "Import failed");
      setProgress(0);
    },
  });

  const columns: ColumnDef<CsvRow>[] = [
    { id: "name", header: "Name", cell: ({ row }) => <span className="text-sm">{row.original.name || "—"}</span> },
    { id: "category", header: "Category", cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.category || "—"}</span> },
    { id: "price", header: "Price", cell: ({ row }) => <span className="text-sm font-medium">₦{row.original.price || 0}</span> },
    { id: "stock", header: "Stock", cell: ({ row }) => <span className="text-sm">{row.original.stock || 0}</span> },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) =>
        (row.original._errors?.length ?? 0) > 0 ? (
          <span className="text-xs font-semibold text-danger">{row.original._errors!.join(", ")}</span>
        ) : (
          <span className="text-xs font-semibold text-success">✓ Valid</span>
        ),
    },
  ];

  return (
    <AppModal
      isOpen={isOpen}
      onClose={() => onOpenChange(false)}
      title="Import Products from CSV"
      description="Upload a CSV file to bulk-create products. Required columns: name, price."
      className="max-w-3xl"
      footer={
        <div className="flex w-full items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {rows.length > 0 && `${validRows.length} valid, ${errorRows.length} with errors`}
          </span>
          <div className="flex gap-2">
            <AppButton variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Cancel</AppButton>
            <AppButton
              variant="primary"
              size="sm"
              onClick={() => importMutation.mutate()}
              isLoading={importMutation.isPending}
              disabled={validRows.length === 0}
            >
              <Upload className="h-4 w-4" />
              Import {validRows.length > 0 ? `${validRows.length} Product${validRows.length === 1 ? "" : "s"}` : ""}
            </AppButton>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Dropzone */}
        {rows.length === 0 && (
          <div
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-kwik-border p-8 text-center transition-colors hover:border-accent hover:bg-accent/5"
          >
            <FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium text-foreground">Drop your CSV here, or</p>
            <label className="mt-2 cursor-pointer text-sm font-semibold text-accent hover:underline">
              browse files
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </label>
            <p className="mt-2 text-xs text-muted-foreground">Max 5MB. Columns: name, description, category, price, compare_price, stock, sku, tags</p>
          </div>
        )}

        {/* File info + clear */}
        {rows.length > 0 && (
          <div className="flex items-center justify-between rounded-lg border border-kwik-border bg-surface px-4 py-2">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-success" />
              <span className="text-sm font-medium text-foreground">{fileName}</span>
              <span className="text-xs text-muted-foreground">({rows.length} rows)</span>
            </div>
            <button
              onClick={() => { setRows([]); setFileName(""); }}
              className="text-muted-foreground hover:text-danger"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Progress bar */}
        {importMutation.isPending && (
          <ProgressBar value={progress} variant="accent" showLabel label="Importing..." />
        )}

        {/* Preview table */}
        {rows.length > 0 && (
          <DataTable columns={columns} data={rows.slice(0, 10)} enableSorting={false} pagination={false} />
        )}

        {rows.length > 10 && (
          <p className="text-center text-xs text-muted-foreground">Showing first 10 of {rows.length} rows</p>
        )}
      </div>
    </AppModal>
  );
}

export default CsvImportModal;
