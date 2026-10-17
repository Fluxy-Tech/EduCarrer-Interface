"use client"

import * as React from "react";
import { Pie, PieChart, Label } from "recharts";

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart";
import { useAvaliationsVacancysAdmin } from "@/app/services/avaliationsVacancy.swr";
import { useMetricsAdmin } from "@/app/services/metrics.swr";
export const description = "A donut chart with text"

const chartConfig = {
    satisfied: {
        label: "Gostaram",
        color: "var(--chart-1)",
    },
    unsatisfied: {
        label: "Não gostaram",
        color: "var(--chart-2)",
    },
    empty: {
        label: "Sem avaliações",
        color: "var(--muted)",
    }
} satisfies ChartConfig

export default function CharRecomedacaoDeVagas() {
    const { metrics } = useMetricsAdmin();

    const { chartData, totalAvaliations, accuracy, isEmpty } = React.useMemo(() => {

        const accuracy = metrics?.totalSatisfationOfThesRecomendationVancancy ?? 0;
        const cont = metrics?.countSatisfationOfThesRecomendationVancancy ?? 0;
        const empty = metrics?.totalSatisfationOfThesRecomendationVancancy == 0;
        const satisfiedCount = metrics?.countPositiveOfThesRecomendationVancancy ?? 0;
        const unsatisfiedCount = metrics?.countNegativeOfThesRecomendationVancancy ?? 0;

        return {
            chartData: empty
                ? [{ status: "empty", visitors: 1, fill: "var(--color-empty)" }]
                : [
                    { status: "satisfied", visitors: satisfiedCount, fill: "var(--color-satisfied)" },
                    { status: "unsatisfied", visitors: unsatisfiedCount, fill: "var(--color-unsatisfied)" },
                ],
            totalAvaliations: cont,
            accuracy: accuracy,
            isEmpty: empty,
        };
    }, [metrics]);

    return (
        <Card className="flex flex-col">
            <CardHeader className="items-center pb-0!">
                <CardTitle className="font-display text-2xl font-normal text-ink text-center">Acurácia das recomendações</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 pb-0!">
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square max-h-62.5"
                >
                    <PieChart>
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                        />
                        <Pie
                            data={chartData}
                            dataKey="visitors"
                            nameKey="status"
                            innerRadius={60}
                            strokeWidth={5}
                        >
                            <Label
                                content={({ viewBox }) => {
                                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                        return (
                                            <text
                                                x={viewBox.cx}
                                                y={viewBox.cy}
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                            >
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={viewBox.cy}
                                                    className="text-3xl text-black! font-bold"
                                                >
                                                    {isEmpty ? "0%" : `${metrics?.totalSatisfationOfThesRecomendationVancancy ?? 0}%`}
                                                </tspan>
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={(viewBox.cy || 0) + 24}
                                                    className="text-gray-400"
                                                >
                                                    avaliações
                                                </tspan>
                                            </text>
                                        )
                                    }
                                }}
                            />
                        </Pie>
                    </PieChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col text-sm">
                <div className="text-black flex items-center leading-none font-medium">
                    {metrics?.countSatisfationOfThesRecomendationVancancy} Avaliações
                </div>
            </CardFooter>
        </Card>
    )
}