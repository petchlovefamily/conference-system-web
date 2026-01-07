/**
 * Conference Management Dashboard Charts
 */

// Helper function to get colors from data attribute
function getChartColors(elementId) {
    var element = document.querySelector(elementId);
    if (element) {
        var dataColors = element.getAttribute('data-colors');
        return dataColors ? dataColors.split(',') : ['#5b69bc', '#10c469', '#35b8e0', '#ff8acc'];
    }
    return ['#5b69bc', '#10c469', '#35b8e0', '#ff8acc'];
}

// Total Events Chart (Radial)
var totalEventsChart = document.querySelector("#total-events-chart");
if (totalEventsChart) {
    var colors = getChartColors("#total-events-chart");
    var optionsTotalEvents = {
        series: [75],
        chart: {
            type: "radialBar",
            height: 81,
            width: 81,
            sparkline: { enabled: false }
        },
        plotOptions: {
            radialBar: {
                offsetY: 0,
                hollow: { margin: 0, size: "50%" },
                dataLabels: {
                    name: { show: false },
                    value: {
                        offsetY: 5,
                        fontSize: "14px",
                        fontWeight: "600",
                        formatter: function (val) { return val + "%"; }
                    }
                }
            }
        },
        grid: { padding: { top: -18, bottom: -20, left: -20, right: -20 } },
        colors: colors
    };
    new ApexCharts(totalEventsChart, optionsTotalEvents).render();
}

// Total Revenue Chart (Radial)
var totalRevenueChart = document.querySelector("#total-revenue-chart");
if (totalRevenueChart) {
    var colors = getChartColors("#total-revenue-chart");
    var optionsTotalRevenue = {
        series: [82],
        chart: {
            type: "radialBar",
            height: 81,
            width: 81,
            sparkline: { enabled: false }
        },
        plotOptions: {
            radialBar: {
                offsetY: 0,
                hollow: { margin: 0, size: "50%" },
                dataLabels: {
                    name: { show: false },
                    value: {
                        offsetY: 5,
                        fontSize: "14px",
                        fontWeight: "600",
                        formatter: function (val) { return val + "%"; }
                    }
                }
            }
        },
        grid: { padding: { top: -18, bottom: -20, left: -20, right: -20 } },
        colors: colors
    };
    new ApexCharts(totalRevenueChart, optionsTotalRevenue).render();
}

// Registration Statistics Chart (Donut)
var registrationStatsChart = document.querySelector("#registration-stats-chart");
if (registrationStatsChart) {
    var colors = getChartColors("#registration-stats-chart");
    var optionsRegistrationStats = {
        chart: {
            height: 277,
            type: "donut"
        },
        series: [1245, 328, 892, 382], // Online, Walk-in, Early Bird, Group
        legend: {
            show: true,
            position: "bottom",
            horizontalAlign: "center",
            verticalAlign: "middle",
            floating: false,
            fontSize: "14px",
            offsetX: 0,
            offsetY: 7
        },
        labels: ["Online", "Walk-in", "Early Bird", "Group"],
        colors: colors,
        stroke: { show: false }
    };
    new ApexCharts(registrationStatsChart, optionsRegistrationStats).render();
}

// Revenue Overview Chart (Bar)
var revenueOverviewChart = document.querySelector("#revenue-overview-chart");
if (revenueOverviewChart) {
    var colors = getChartColors("#revenue-overview-chart");
    var optionsRevenueOverview = {
        series: [{
            name: "Revenue (฿K)",
            type: "bar",
            data: [156, 245, 189, 312, 278, 398, 425, 312, 456, 389, 512, 478]
        }],
        chart: {
            height: 301,
            type: "bar",
            toolbar: { show: false }
        },
        stroke: { width: 0, curve: "smooth" },
        plotOptions: {
            bar: {
                columnWidth: "45%",
                barHeight: "70%",
                borderRadius: 5
            }
        },
        xaxis: {
            categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        },
        yaxis: {
            labels: {
                formatter: function (val) { return "฿" + val + "K"; }
            }
        },
        colors: colors,
        tooltip: {
            y: {
                formatter: function (val) { return "฿" + val + "K"; }
            }
        }
    };
    new ApexCharts(revenueOverviewChart, optionsRevenueOverview).render();
}

// Attendance Trends Chart (Line)
var attendanceChart = document.querySelector("#attendance-chart");
if (attendanceChart) {
    var colors = getChartColors("#attendance-chart");
    var optionsAttendance = {
        series: [
            {
                name: "Registrations",
                data: [245, 312, 278, 356, 412, 389, 478, 345, 512, 423, 489, 534]
            },
            {
                name: "Check-ins",
                data: [210, 278, 245, 312, 378, 356, 423, 312, 467, 389, 445, 489]
            }
        ],
        stroke: { width: 3, curve: "smooth" },
        chart: {
            height: 299,
            type: "line",
            zoom: { enabled: false },
            toolbar: { show: false }
        },
        dataLabels: { enabled: false },
        xaxis: {
            categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        },
        colors: colors,
        tooltip: {
            shared: true,
            y: [{
                formatter: function (val) { return val !== undefined ? val + " attendees" : val; }
            }, {
                formatter: function (val) { return val !== undefined ? val + " checked-in" : val; }
            }]
        },
        legend: {
            show: true,
            position: "top",
            horizontalAlign: "right"
        }
    };
    new ApexCharts(attendanceChart, optionsAttendance).render();
}

// Legacy chart IDs for backward compatibility
// Total Orders Chart (kept for backward compatibility)
var totalOrdersChart = document.querySelector("#total-orders-chart");
if (totalOrdersChart && !totalEventsChart) {
    var colors = getChartColors("#total-orders-chart");
    var options1 = {
        series: [65],
        chart: {
            type: "radialBar",
            height: 81,
            width: 81,
            sparkline: { enabled: false }
        },
        plotOptions: {
            radialBar: {
                offsetY: 0,
                hollow: { margin: 0, size: "50%" },
                dataLabels: {
                    name: { show: false },
                    value: {
                        offsetY: 5,
                        fontSize: "14px",
                        fontWeight: "600",
                        formatter: function (o) { return o + "k"; }
                    }
                }
            }
        },
        grid: { padding: { top: -18, bottom: -20, left: -20, right: -20 } },
        colors: colors
    };
    new ApexCharts(totalOrdersChart, options1).render();
}

// New Users Chart (kept for backward compatibility)
var newUsersChart = document.querySelector("#new-users-chart");
if (newUsersChart) {
    var colors = getChartColors("#new-users-chart");
    var options2 = {
        series: [75],
        chart: {
            type: "radialBar",
            height: 81,
            width: 81,
            sparkline: { enabled: false }
        },
        plotOptions: {
            radialBar: {
                offsetY: 0,
                hollow: { margin: 0, size: "50%" },
                dataLabels: {
                    name: { show: false },
                    value: {
                        offsetY: 5,
                        fontSize: "14px",
                        fontWeight: "600",
                        formatter: function (o) { return o + "k"; }
                    }
                }
            }
        },
        grid: { padding: { top: -18, bottom: -20, left: -20, right: -20 } },
        colors: colors
    };
    new ApexCharts(newUsersChart, options2).render();
}

// Data Visits Chart (kept for backward compatibility)
var dataVisitsChart = document.querySelector("#data-visits-chart");
if (dataVisitsChart) {
    var colors = getChartColors("#data-visits-chart");
    var optionsDataVisits = {
        chart: { height: 277, type: "donut" },
        series: [65, 14, 10, 45],
        legend: {
            show: true,
            position: "bottom",
            horizontalAlign: "center",
            verticalAlign: "middle",
            floating: false,
            fontSize: "14px",
            offsetX: 0,
            offsetY: 7
        },
        labels: ["Direct", "Social", "Marketing", "Affiliates"],
        colors: colors,
        stroke: { show: false }
    };
    new ApexCharts(dataVisitsChart, optionsDataVisits).render();
}

// Statistics Chart (kept for backward compatibility)
var statisticsChart = document.querySelector("#statistics-chart");
if (statisticsChart) {
    var colors = getChartColors("#statistics-chart");
    var optionsStatistics = {
        series: [{
            name: "Open Campaign",
            type: "bar",
            data: [89.25, 98.58, 68.74, 108.87, 77.54, 84.03, 51.24]
        }],
        chart: {
            height: 301,
            type: "line",
            toolbar: { show: false }
        },
        stroke: { width: 0, curve: "smooth" },
        plotOptions: {
            bar: { columnWidth: "20%", barHeight: "70%", borderRadius: 5 }
        },
        xaxis: { categories: ["2019", "2020", "2021", "2022", "2023", "2024", "2025"] },
        colors: colors
    };
    new ApexCharts(statisticsChart, optionsStatistics).render();
}

// Revenue Chart (kept for backward compatibility)
var revenueChart = document.querySelector("#revenue-chart");
if (revenueChart) {
    var colors = getChartColors("#revenue-chart");
    var optionsRevenue = {
        series: [
            { name: "Total Income", data: [82, 85, 70, 90, 75, 78, 65, 50, 72, 60, 80, 70] },
            { name: "Total Expenses", data: [30, 32, 40, 35, 30, 36, 37, 28, 34, 42, 38, 30] }
        ],
        stroke: { width: 3, curve: "straight" },
        chart: {
            height: 299,
            type: "line",
            zoom: { enabled: false },
            toolbar: { show: false }
        },
        dataLabels: { enabled: false },
        xaxis: { categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] },
        colors: colors,
        tooltip: {
            shared: true,
            y: [
                { formatter: function (o) { return o !== undefined ? "$" + o.toFixed(2) + "k" : o; } },
                { formatter: function (o) { return o !== undefined ? "$" + o.toFixed(2) + "k" : o; } }
            ]
        }
    };
    new ApexCharts(revenueChart, optionsRevenue).render();
}