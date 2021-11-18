import PropTypes from 'prop-types';
import { useState, useMemo } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Grid, MenuItem, TextField, Typography } from '@mui/material';

// third-party
import Chart from 'react-apexcharts';
import axios from 'axios';
import { DateTime } from 'luxon';

// project imports
import SkeletonTotalGrowthBarChart from 'ui-component/cards/Skeleton/TotalGrowthBarChart';
import MainCard from 'ui-component/cards/MainCard';
import { gridSpacing } from 'store/constant';
import config from 'config';

function generateCatChartData(cat, visits) {
    const seriesData = {
        name: cat.name,
        data: visits.map((v) => ({
            x: v.tick,
            y: v.total_collapsed
        }))
    };
    return seriesData;
}

function wrapCatVisitsForChartData(cats, visits) {
    // get series data for cats
    const series = cats.filter((cat) => visits[cat.name].length > 0).map((cat) => generateCatChartData(cat, visits[cat.name]));

    // determine the maxium Y value
    let maxY = 0;
    series.forEach((s) => {
        maxY += s.data.map((d) => d.y).reduce((prev, next) => Math.max(prev, next), 0);
    });
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
                            dateFormatter: (timestamp) => new Date(timestamp).toLocaleString().replaceAll(',', ' ')
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
                size: 6,
                formatter: (val) => val
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
                min: 0,
                tickAmount: yTickAmount
            },
            tooltip: {
                x: {
                    format: 'dd MMM HH:mm'
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
    }
    // {
    //     value: 'month',
    //     label: 'This Month'
    // }
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
                        borderColor: grey200
                    },
                    tooltip: {
                        theme: 'light'
                    },
                    legend: {
                        labels: {
                            colors: grey500
                        }
                    }
                }
            });

            if (['today', 'yesterday'].includes(value)) {
                let visitCount = 0;
                const visits = {};

                cats.forEach((cat) => {
                    if (value === 'today') {
                        visits[cat.name] = cat.today_visits;
                    } else if (value === 'yesterday') {
                        visits[cat.name] = cat.yesterday_visits;
                    } else {
                        visits[cat.name] = [];
                    }

                    visitCount += visits[cat.name].map((v) => v.total_collapsed).reduce((prev, next) => prev + next, 0);
                });

                setTotalVisitCount(visitCount);
                setChartData(updateChartColors(wrapCatVisitsForChartData(cats, visits)));
                setFetchingChartData(false);
            } else if (value === 'week') {
                setFetchingChartData(true);

                if (otherIntervalData.week) {
                    setTotalVisitCount(otherIntervalData.week.visitCount);
                    setChartData(updateChartColors(wrapCatVisitsForChartData(otherIntervalData.week.cats, otherIntervalData.week.visits)));
                    setFetchingChartData(false);
                } else {
                    const fourHours = 4 * 60 * 60 * 1000;

                    const now = DateTime.now();
                    const firstDay = now.minus({ day: now.weekday });
                    const sunday = firstDay.toFormat('yyyy.MM.dd');
                    const saturday = firstDay.plus({ day: 6 }).toFormat('yyyy.MM.dd');

                    // load cat data for display in cat cards
                    axios
                        .get(`${config.apiBaseUrl}/cats/visits?start_date=${sunday}&end_date=${saturday}&collapse_ms=${fourHours}`)
                        .then((response) => {
                            const cats = response.data.cats;

                            let visitCount = 0;
                            const visits = {};
                            cats.forEach((cat) => {
                                visits[cat.name] = cat.visits;
                                visitCount += cat.visits.map((v) => v.total_collapsed).reduce((prev, next) => prev + next, 0);
                            });

                            setTotalVisitCount(visitCount);
                            setChartData(updateChartColors(wrapCatVisitsForChartData(cats, visits)));
                            setFetchingChartData(false);

                            setOtherIntervalData({
                                ...otherIntervalData,
                                week: { visitCount, cats, visits }
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
                                            <Typography variant="h3">{totalVisitCount}</Typography>
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
                            {fetchingChartData ? <Chart {...wrapCatVisitsForChartData([])} /> : <Chart {...chartData} />}
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
