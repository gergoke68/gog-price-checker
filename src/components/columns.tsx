"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "./ui/button";
import * as Flags from "country-flag-icons/react/3x2";
import { countries } from "@/lib/countries";

export type Price = {
  country: string;
  price: number;
};

export const columns: ColumnDef<Price>[] = [
  {
    id: "flag",
    accessorFn: (row) => row.country,
    header: () => <div className="text-center w-[100px]">Flag</div>,
    cell: ({ getValue }) => {
      const code = getValue() as string;
      const upperCode = code.toUpperCase();
      // @ts-expect-error - Flags typing issue
      const FlagComponent = Flags[upperCode];
      return (
        <div className="text-xl text-center w-[100px]">
          {FlagComponent ? (
            <FlagComponent className="h-6 inline-block" title={code} />
          ) : (
            code
          )}
        </div>
      );
    },
  },
  {
    id: "countryName",
    accessorFn: (row) => {
      const code = row.country.toUpperCase();
      return countries[code] || code;
    },
    header: ({ column }) => {
      return (
        <div className="w-[200px]">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="w-full justify-center"
          >
            Country Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      );
    },
    cell: ({ getValue }) => {
      return <div className="text-center w-[200px]">{String(getValue())}</div>;
    },
  },
  {
    id: "countryCode",
    accessorFn: (row) => row.country,
    header: () => <div className="text-center w-[100px]">Code</div>,
    cell: ({ getValue }) => {
      const code = getValue() as string;
      return <div className="text-slate-400 text-center w-[100px]">{code}</div>;
    },
  },
  {
    accessorKey: "price",
    header: ({ column }) => {
      return (
        <div className="w-[150px]">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="w-full justify-center"
          >
            Price (USD)
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("price"));
      return <div className="text-center w-[150px]">${price.toFixed(2)}</div>;
    },
  },
];
