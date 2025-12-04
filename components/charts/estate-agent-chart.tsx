"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
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

interface EstateAgentChartProps {
  data: { name: string; count: number }[];
}

// Vibrant color palette for the donut chart
const COLORS = [
  "oklch(0.65 0.2 250)",   // Blue
  "oklch(0.65 0.2 150)",   // Green
  "oklch(0.65 0.2 30)",    // Orange
  "oklch(0.65 0.2 330)",   // Pink
  "oklch(0.65 0.2 200)",   // Cyan
  "oklch(0.5 0.1 260)",    // Muted purple for Others
];

export function EstateAgentChart({ data }: EstateAgentChartProps) {
  // Calculate total for center display
  const total = data.reduce((sum, item) => sum + item.count, 0);

  // Create chart config dynamically
  const chartConfig: ChartConfig = {};
  data.forEach((item, index) => {
    chartConfig[item.name] = {
      label: item.name,
      color: COLORS[index % COLORS.length],
    };
  });

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-foreground">
          Salespersons by Estate Agent
        </CardTitle>
        <CardDescription>
          Distribution of registered salespersons across estate agencies
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="45%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={2}
                dataKey="count"
                nameKey="name"
                label={({ name, percent }) =>
                  `${name.split(" ")[0]} ${(percent * 100).toFixed(0)}%`
                }
                labelLine={{ stroke: "var(--muted-foreground)", strokeWidth: 1 }}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    stroke="var(--background)"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => [
                      `${Number(value).toLocaleString()} salespersons`,
                      name,
                    ]}
                  />
                }
              />
              <Legend
                verticalAlign="bottom"
                height={50}
                formatter={(value) => (
                  <span className="text-xs text-muted-foreground">{value}</span>
                )}
              />
              {/* Center text */}
              <text
                x="50%"
                y="42%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-foreground text-2xl font-bold"
              >
                {total.toLocaleString()}
              </text>
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-muted-foreground text-xs"
              >
                Total Salespersons
              </text>
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}



