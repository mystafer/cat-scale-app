import PropTypes from 'prop-types';
import { useState } from 'react';

// material-ui
import { useTheme, styled } from '@mui/material/styles';
import { Avatar, Box, Button, Grid, Typography } from '@mui/material';

// third-party
import Chart from 'react-apexcharts';

// project imports
import MainCard from 'ui-component/cards/MainCard';
import SkeletonCatCard from 'ui-component/cards/Skeleton/CatCard';

// assets
import PetsOutlinedIcon from '@mui/icons-material/PetsOutlined';

function wrapCatWeightsForChartData(cat, timeValue) {
    const yesterdayWeights = cat.yesterday_events.map((e) => e.event_data.weight);
    const todayWeights = cat.today_events.map((e) => e.event_data.weight);

    const minWeight = Math.min(Math.min(...yesterdayWeights), Math.min(...todayWeights)) - 0.2;
    const maxWeight = Math.max(Math.max(...yesterdayWeights), Math.max(...todayWeights)) + 0.2;

    const chartData = {
        type: 'line',
        height: 90,
        options: {
            chart: {
                sparkline: {
                    enabled: true
                }
            },
            dataLabels: {
                enabled: false
            },
            colors: ['#fff'],
            fill: {
                type: 'solid',
                opacity: 1
            },
            stroke: {
                curve: 'smooth',
                width: 3
            },
            yaxis: {
                min: minWeight,
                max: maxWeight
            },
            tooltip: {
                theme: 'dark',
                fixed: {
                    enabled: false
                },
                x: {
                    show: false
                },
                y: {
                    title: 'Total Order'
                },
                marker: {
                    show: false
                }
            }
        },
        series: [
            {
                name: 'weight',
                data: timeValue ? yesterdayWeights : todayWeights
            }
        ]
    };

    return chartData;
}

const CardWrapper = styled(MainCard)(({ theme, palettecolor }) => ({
    backgroundColor: palettecolor.dark,
    color: '#fff',
    overflow: 'hidden',
    position: 'relative',
    '&>div': {
        position: 'relative',
        zIndex: 5
    },
    '&:after': {
        content: '""',
        position: 'absolute',
        width: 210,
        height: 210,
        background: palettecolor[800],
        borderRadius: '50%',
        zIndex: 1,
        top: -85,
        right: -95,
        [theme.breakpoints.down('sm')]: {
            top: -105,
            right: -140
        }
    },
    '&:before': {
        content: '""',
        position: 'absolute',
        zIndex: 1,
        width: 210,
        height: 210,
        background: palettecolor[800],
        borderRadius: '50%',
        top: -125,
        right: -15,
        opacity: 0.5,
        [theme.breakpoints.down('sm')]: {
            top: -155,
            right: -70
        }
    }
}));

// ==============================|| DASHBOARD - CAT CARD ||============================== //

const AVAILABLE_COLORS = ['primary', 'secondary', 'warning', 'success', 'orange'];

const CatCard = ({ catIndex, cat, isLoading }) => {
    const theme = useTheme();

    const [timeValue, setTimeValue] = useState(false);
    const handleChangeTime = (event, newValue) => {
        setTimeValue(newValue);
    };

    const paletteColorName = AVAILABLE_COLORS[catIndex % AVAILABLE_COLORS.length];
    const paletteColor = theme.palette[paletteColorName];

    return (
        <>
            {isLoading ? (
                <SkeletonCatCard />
            ) : (
                <CardWrapper border={false} content={false} palettecolor={paletteColor}>
                    <Box sx={{ p: 2.25 }}>
                        <Grid container direction="column">
                            <Grid item>
                                <Grid container justifyContent="space-between">
                                    <Grid item>
                                        <Avatar
                                            variant="rounded"
                                            sx={{
                                                ...theme.typography.commonAvatar,
                                                ...theme.typography.largeAvatar,
                                                backgroundColor: paletteColor[800],
                                                color: '#fff',
                                                mt: 1
                                            }}
                                        >
                                            <PetsOutlinedIcon fontSize="inherit" />
                                        </Avatar>
                                    </Grid>
                                    <Grid item>
                                        <Button
                                            disableElevation
                                            variant={timeValue ? 'contained' : 'text'}
                                            size="small"
                                            color={paletteColorName}
                                            sx={{ color: 'inherit' }}
                                            onClick={(e) => handleChangeTime(e, true)}
                                        >
                                            Yesterday
                                        </Button>
                                        <Button
                                            disableElevation
                                            variant={!timeValue ? 'contained' : 'text'}
                                            size="small"
                                            color={paletteColorName}
                                            sx={{ color: 'inherit' }}
                                            onClick={(e) => handleChangeTime(e, false)}
                                        >
                                            Today
                                        </Button>
                                    </Grid>
                                </Grid>
                            </Grid>
                            <Grid item sx={{ mb: 0.75 }}>
                                <Grid container alignItems="center">
                                    <Grid item xs={6}>
                                        <Grid container alignItems="center">
                                            <Grid item>
                                                {timeValue ? (
                                                    <Typography sx={{ fontSize: '2.125rem', fontWeight: 500, mr: 1, mt: 1.75, mb: 0.75 }}>
                                                        {cat.yesterday_weight.toFixed(2)} lbs
                                                    </Typography>
                                                ) : (
                                                    <Typography sx={{ fontSize: '2.125rem', fontWeight: 500, mr: 1, mt: 1.75, mb: 0.75 }}>
                                                        {cat.today_weight.toFixed(2)} lbs
                                                    </Typography>
                                                )}
                                            </Grid>
                                            <Grid item xs={12}>
                                                <Typography
                                                    sx={{
                                                        fontSize: '1rem',
                                                        fontWeight: 500,
                                                        color: paletteColor[200]
                                                    }}
                                                >
                                                    {cat.name}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Chart {...wrapCatWeightsForChartData(cat, timeValue)} />
                                    </Grid>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Box>
                </CardWrapper>
            )}
        </>
    );
};

CatCard.propTypes = {
    isLoading: PropTypes.bool,
    catIndex: PropTypes.number,
    cat: PropTypes.any
};

export default CatCard;
