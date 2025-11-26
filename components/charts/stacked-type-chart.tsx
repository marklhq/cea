"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface StackedTypeChartProps {
  title: string;
  description: string;
  data: { year: string; [key: string]: string | number }[];
  types: string[];
  colors: string[];
}

export function StackedTypeChart({
  title,
  description,
  data,
  types,
  colors,
}: StackedTypeChartProps) {
  // Create chart config dynamically
  const chartConfig: ChartConfig = {};
  types.forEach((type, index) => {
    chartConfig[type] = {
      label: type.replace(/_/g, " "),
      color: colors[index % colors.length],
    };
  });

  // Convert data to percentages
  const percentageData = data.map((item) => {
    const total = types.reduce((sum, type) => sum + (Number(item[type]) || 0), 0);
    const result: { year: string; [key: string]: string | number } = { year: item.year };
    types.forEach((type) => {
      result[type] = total > 0 ? ((Number(item[type]) || 0) / total) * 100 : 0;
    });
    return result;
  });

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-foreground">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={percentageData}
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border)"
              />
              <XAxis
                dataKey="year"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                tickFormatter={(value) => `${Math.round(value)}%`}
                domain={[0, 100]}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => {
                      const numValue = Number(value);
                      return [`${numValue.toFixed(1)}%`, String(name).replace(/_/g, " ")];
                    }}
                  />
                }
                cursor={{ fill: "var(--muted)", opacity: 0.3 }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => (
                  <span className="text-xs text-muted-foreground">
                    {String(value).replace(/_/g, " ")}
                  </span>
                )}
              />
              {types.map((type, index) => (
                <Bar
                  key={type}
                  dataKey={type}
                  stackId="stack"
                  fill={colors[index % colors.length]}
                  name={type}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
