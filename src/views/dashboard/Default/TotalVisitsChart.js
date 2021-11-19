import PropTypes from 'prop-types';
import { useState, useMemo } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Box, Grid, LinearProgress, MenuItem, TextField, Typography } from '@mui/material';

// third-party
import Chart from 'react-apexcharts';
import axios from 'axios';
import { DateTime } from 'luxon';

// project imports
import SkeletonTotalGrowthBarChart from 'ui-component/cards/Skeleton/TotalGrowthBarChart';
import MainCard from 'ui-component/cards/MainCard';
import { gridSpacing } from 'store/constant';
import config from 'config';

function generateCatChartData(cat, intervals) {
    const seriesData = {
        name: cat.name,
        data: intervals.map((interval) => ({
            x: interval.tick,
            y: interval.total_collapsed
        }))
    };
    return seriesData;
}

function wrapCatVisitsForChartData(cats, intervals, suppressTime) {
    // get series data for cats
    const series = cats.filter((cat) => intervals[cat.name].length > 0).map((cat) => generateCatChartData(cat, intervals[cat.name]));

    // determine the minimumm and maxium Y value
    let maxY = 0;
    series.forEach((s) => {
        maxY += s.data.map((d) => d.y).reduce((prev, next) => Math.max(prev, next), 0);
    });
    const minY = maxY === 1 ? 0 : 1;
    maxY = Math.max(maxY, 2);
    const yTickAmount = maxY > 0 ? Math.min(6, maxY) : 5;

    // build chart data object
    const chartData = {
        height: 480,
        type: 'line',
        options: {
            chart: {
                id: 'visits-chart',
                toolbar: {
                    show: true,
                    export: {
                        csv: {
                            dateFormatter: (timestamp) =>
                                suppressTime
                                    ? new Date(timestamp).toDateString()
                                    : new Date(timestamp).toLocaleString().replaceAll(',', ' ')
                        }
                    }
                },
                zoom: {
                    enabled: true
                }
            },
            responsive: [
                {
                    breakpoint: 480,
                    options: {
                        legend: {
                            position: 'bottom',
                            offsetX: -10,
                            offsetY: 0
                        }
                    }
                }
            ],
            legend: {
                show: true,
                fontSize: '14px',
                fontFamily: `'Roboto', sans-serif`,
                position: 'bottom',
                offsetX: 20,
                labels: {
                    useSeriesColors: false
                },
                markers: {
                    width: 16,
                    height: 16,
                    radius: 5
                },
                itemMargin: {
                    horizontal: 15,
                    vertical: 8
                }
            },
            fill: {
                type: 'solid'
            },
            dataLabels: {
                enabled: false
            },
            grid: {
                show: true
            },
            stroke: {
                curve: 'smooth'
            },
            markers: {
                size: 6
            },
            xaxis: {
                type: 'datetime',
                labels: {
                    datetimeUTC: false
                }
            },
            yaxis: {
                labels: {
                    formatter: (value) => {
                        if (value.toFixed(4) % 1 === 0) {
                            const num = value.toFixed(0);
                            if (num > 0 && num < 2) return '1 visit';
                            return `${num} visits`;
                        }
                        return '';
                    }
                },
                min: minY,
                max: maxY,
                tickAmount: yTickAmount
            },
            tooltip: {
                theme: 'light',
                x: {
                    format: suppressTime ? 'dd MMM' : 'dd MMM HH:mm'
                }
            }
        },
        series
    };

    return chartData;
}

const status = [
    {
        value: 'today',
        label: 'Today'
    },
    {
        value: 'yesterday',
        label: 'Yesterday'
    },
    {
        value: 'week',
        label: 'This Week'
    },
    {
        value: 'month',
        label: 'This Month'
    }
];

// ==============================|| DASHBOARD DEFAULT - TOTAL VISITS CHART ||============================== //

const TotalVisitsChart = ({ isLoading, cats }) => {
    const [value, setValue] = useState('today');
    const theme = useTheme();
    const [chartData, setChartData] = useState(null);
    const [fetchingChartData, setFetchingChartData] = useState(true);
    const [totalVisitCount, setTotalVisitCount] = useState(0);
    const [otherIntervalData, setOtherIntervalData] = useState({});

    const grey200 = theme.palette.grey[200];
    const grey500 = theme.palette.grey[500];

    const color1 = theme.palette.primary.dark;
    const color2 = theme.palette.secondary.dark;
    const color3 = theme.palette.cat3.dark;
    const color4 = theme.palette.cat4.dark;
    const color5 = theme.palette.cat5.dark;

    // calculate chart data based on cats
    useMemo(() => {
        if (!isLoading) {
            // update the chart look and feel
            const updateChartColors = (chartData) => ({
                ...chartData,
                options: {
                    ...chartData.options,
                    colors: [color1, color2, color3, color4, color5],
                    grid: {
                        ...chartData.options.grid,
                        borderColor: grey200
                    },
                    legend: {
                        ...chartData.options.legend,
                        labels: {
                            ...chartData.options.legend.labels,
                            colors: grey500
                        }
                    }
                }
            });

            if (['today', 'yesterday'].includes(value)) {
                let visitCount = 0;
                const intervals = {};

                cats.forEach((cat) => {
                    if (value === 'today') {
                        intervals[cat.name] = cat.today_intervals;
                    } else if (value === 'yesterday') {
                        intervals[cat.name] = cat.yesterday_intervals;
                    } else {
                        intervals[cat.name] = [];
                    }

                    visitCount += intervals[cat.name].map((v) => v.total_collapsed).reduce((prev, next) => prev + next, 0);
                });

                setTotalVisitCount(visitCount);
                setChartData(updateChartColors(wrapCatVisitsForChartData(cats, intervals)));
                setFetchingChartData(false);
            } else if (value === 'week') {
                setFetchingChartData(true);

                if (otherIntervalData.week) {
                    setTotalVisitCount(otherIntervalData.week.visitCount);
                    setChartData(
                        updateChartColors(wrapCatVisitsForChartData(otherIntervalData.week.cats, otherIntervalData.week.intervals))
                    );
                    setFetchingChartData(false);
                } else {
                    const sixHours = 6 * 60 * 60 * 1000;

                    const now = DateTime.now();
                    const firstDay = now.minus({ day: now.weekday });
                    const sunday = firstDay.toFormat('yyyy.MM.dd');
                    const saturday = firstDay.plus({ day: 6 }).toFormat('yyyy.MM.dd');

                    // load cat data for display in cat cards
                    axios
                        .get(`${config.apiBaseUrl}/cats/intervals?start_date=${sunday}&end_date=${saturday}&collapse_ms=${sixHours}`)
                        .then((response) => {
                            const cats = response.data.cats;

                            let visitCount = 0;
                            const intervals = {};
                            cats.forEach((cat) => {
                                intervals[cat.name] = cat.intervals;
                                visitCount += cat.intervals.map((v) => v.total_collapsed).reduce((prev, next) => prev + next, 0);
                            });

                            setTotalVisitCount(visitCount);
                            setChartData(updateChartColors(wrapCatVisitsForChartData(cats, intervals)));
                            setFetchingChartData(false);

                            setOtherIntervalData({
                                ...otherIntervalData,
                                week: { visitCount, cats, intervals }
                            });
                        })
                        .catch((error) => {
                            console.log(error);
                        });
                }
            } else if (value === 'month') {
                setFetchingChartData(true);

                if (otherIntervalData.month) {
                    setTotalVisitCount(otherIntervalData.month.visitCount);
                    setChartData(
                        updateChartColors(wrapCatVisitsForChartData(otherIntervalData.month.cats, otherIntervalData.month.intervals, true))
                    );
                    setFetchingChartData(false);
                } else {
                    const twentyFourHours = 24 * 60 * 60 * 1000;

                    const now = DateTime.now();
                    const firstDay = now.set({ day: 1 });
                    const firstDayStr = firstDay.toFormat('yyyy.MM.dd');
                    const lastDay = firstDay.plus({ month: 1 }).minus({ day: 1 });
                    const lastDayStr = lastDay.toFormat('yyyy.MM.dd');

                    // load cat data for display in cat cards
                    axios
                        .get(
                            `${config.apiBaseUrl}/cats/intervals?start_date=${firstDayStr}&end_date=${lastDayStr}&collapse_ms=${twentyFourHours}`
                        )
                        .then((response) => {
                            const cats = response.data.cats;

                            let visitCount = 0;
                            const intervals = {};
                            cats.forEach((cat) => {
                                intervals[cat.name] = cat.intervals;
                                visitCount += cat.intervals.map((v) => v.total_collapsed).reduce((prev, next) => prev + next, 0);
                            });

                            setTotalVisitCount(visitCount);
                            setChartData(updateChartColors(wrapCatVisitsForChartData(cats, intervals, true)));
                            setFetchingChartData(false);

                            setOtherIntervalData({
                                ...otherIntervalData,
                                month: { visitCount, cats, intervals }
                            });
                        })
                        .catch((error) => {
                            console.log(error);
                        });
                }
            }
        }
    }, [cats, value, otherIntervalData, color1, color2, color3, color4, color5, grey200, isLoading, grey500]);

    return (
        <>
            {isLoading ? (
                <SkeletonTotalGrowthBarChart />
            ) : (
                <MainCard>
                    <Grid container spacing={gridSpacing}>
                        <Grid item xs={12}>
                            <Grid container alignItems="center" justifyContent="space-between">
                                <Grid item>
                                    <Grid container direction="column" spacing={1}>
                                        <Grid item>
                                            <Typography variant="subtitle2">Total Visits</Typography>
                                        </Grid>
                                        <Grid item>
                                            <Typography variant="h3">{fetchingChartData ? 0 : totalVisitCount}</Typography>
                                        </Grid>
                                    </Grid>
                                </Grid>
                                <Grid item>
                                    <TextField
                                        id="standard-select-currency"
                                        select
                                        value={value}
                                        onChange={(e) => setValue(e.target.value)}
                                    >
                                        {status.map((option) => (
                                            <MenuItem key={option.value} value={option.value}>
                                                {option.label}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                            </Grid>
                        </Grid>
                        <Grid item xs={12}>
                            {fetchingChartData ? (
                                <Box height={400}>
                                    <LinearProgress variant="indeterminate" />
                                </Box>
                            ) : (
                                <Chart {...chartData} />
                            )}
                        </Grid>
                    </Grid>
                </MainCard>
            )}
        </>
    );
};

TotalVisitsChart.propTypes = {
    isLoading: PropTypes.bool,
    cats: PropTypes.any
};

export default TotalVisitsChart;
