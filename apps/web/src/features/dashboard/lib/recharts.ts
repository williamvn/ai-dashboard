/**
 * Recharts 2.x shim for React 19 / TS 5+.
 *
 * Recharts 2.x predates React 19's stricter `JSX.ElementType`, so its class-based
 * components (Tooltip, Bar, Line, …) trigger:
 *
 *   "JSX element class does not support attributes because it does not have a 'props' property"
 *
 * Until recharts 3 is adopted, re-exporting through `ComponentType<any>` satisfies
 * the JSX checker while still rendering correctly at runtime. Prop-level safety
 * is traded for compile-ability — recharts' props are documented elsewhere and
 * rarely change, so this is the pragmatic trade.
 */
import type { ComponentType } from 'react';
import * as R from 'recharts';

type Any = ComponentType<any>;

export const AreaChart = R.AreaChart as unknown as Any;
export const Area = R.Area as unknown as Any;
export const BarChart = R.BarChart as unknown as Any;
export const Bar = R.Bar as unknown as Any;
export const CartesianGrid = R.CartesianGrid as unknown as Any;
export const Cell = R.Cell as unknown as Any;
export const Legend = R.Legend as unknown as Any;
export const Line = R.Line as unknown as Any;
export const LineChart = R.LineChart as unknown as Any;
export const Pie = R.Pie as unknown as Any;
export const PieChart = R.PieChart as unknown as Any;
export const ResponsiveContainer = R.ResponsiveContainer as unknown as Any;
export const Tooltip = R.Tooltip as unknown as Any;
export const XAxis = R.XAxis as unknown as Any;
export const YAxis = R.YAxis as unknown as Any;
