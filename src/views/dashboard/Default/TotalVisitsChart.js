import PropTypes from 'prop-types';
import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Grid, MenuItem, TextField, Typography } from '@mui/material';

// third-party
import ApexCharts from 'apexcharts';
import Chart from 'react-apexcharts';

// project imports
import SkeletonTotalGrowthBarChart from 'ui-component/cards/Skeleton/TotalGrowthBarChart';
import MainCard from 'ui-component/cards/MainCard';
import { gridSpacing } from 'store/constant';

function generateCatChartData(cat, visits) {
    const seriesData = {
        name: cat.name,
        data: visits.map((v) => ({
            x: v.start_timestamp,
            y: v.elapsed_sec
        }))
    };
    return seriesData;
}

function wrapCatVisitsForChartData(cats, visits) {
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
                formatter: (val, opts) => {
                    console.log({ val, opts });
                    return val;
                }
            },
            xaxis: {
                type: 'datetime',
                labels: {
                    datetimeUTC: false
                }
            },
            yaxis: {
                labels: {
                    formatter: (value) => `${value} sec`
                }
            },
            tooltip: {
                x: {
                    format: 'dd MMM HH:mm'
                }
            }
        },
        series: cats.filter((cat) => cat.today_visits.length > 0).map((cat) => generateCatChartData(cat, visits[cat.name]))
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
    }
    // {
    //     value: 'week',
    //     label: 'This Week'
    // },
    // {
    //     value: 'month',
    //     label: 'This Month'
    // }
];

// ==============================|| DASHBOARD DEFAULT - TOTAL VISITS CHART ||============================== //

const TotalVisitsChart = ({ isLoading, cats }) => {
    const [value, setValue] = useState('today');
    const theme = useTheme();
    const customization = useSelector((state) => state.customization);
    const [chartData, setChartData] = useState(null);
    const [fetchingChartData, setFetchingChartData] = useState(true);
    const [totalVisitCount, setTotalVisitCount] = useState(0);

    const { navType } = customization;
    const { primary } = theme.palette.text;
    const darkLight = theme.palette.dark.light;
    const grey200 = theme.palette.grey[200];
    const grey500 = theme.palette.grey[500];

    const primary200 = theme.palette.primary[200];
    const primaryDark = theme.palette.primary.dark;
    const secondaryMain = theme.palette.secondary.main;
    const secondaryLight = theme.palette.secondary.light;

    // calculate chart data based on cats
    useMemo(() => {
        if (!isLoading) {
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

                visitCount += visits[cat.name].length;
            });

            setTotalVisitCount(visitCount);
            setChartData(wrapCatVisitsForChartData(cats, visits));
            setFetchingChartData(false);
        }
    }, [isLoading, cats, value]);

    // update the chart look and feel
    useEffect(() => {
        if (chartData) {
            const newChartData = {
                ...chartData.options,
                colors: [primary200, primaryDark, secondaryMain, secondaryLight],
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
            };

            // do not load chart when loading
            if (!isLoading) {
                ApexCharts.exec(`bar-chart`, 'updateOptions', newChartData);
            }
        }
    }, [chartData, navType, primary200, primaryDark, secondaryMain, secondaryLight, primary, darkLight, grey200, isLoading, grey500]);

    return (
        <>
            {isLoading || fetchingChartData ? (
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
                            <Chart {...chartData} />
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
