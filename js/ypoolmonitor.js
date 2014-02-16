var APIkey, coinType, ajaxFailedConnect, dataDate, pts_block_stats_data, flot_options;

coinType = "PTS"
ajaxFailedConnect = "<div class='alert alert-warning alert-dismissable text-center center-block' style='max-width:500px;'><button type='button' class='close' data-dismiss='alert' aria-hidden='true'>&times;</button><strong>Warning!</strong> Cannot connect to ypool API.</div>"
ajaxFailedAuthenticate = "<div class='alert alert-danger alert-dismissable text-center center-block' style='max-width:500px;'><button type='button' class='close' data-dismiss='alert' aria-hidden='true'>&times;</button><strong>Warning!</strong> Invalid ypool API key.</div>"

$(document).ready(function () {
    window.isphone = false;
    if (document.URL.indexOf("http://") === -1 && document.URL.indexOf("https://") === -1) {
        window.isphone = true;
    }
    if (window.isphone) {
        document.addEventListener("deviceready", onDeviceReady, false);
    } else {
        onDeviceReady();
    }
});

function onDeviceReady() {
    $('.form-control[name="key"]').val(localStorage.getItem('APIkey'));
    if (localStorage.coinType) {
        coinType = localStorage.coinType;
        $('#dropdown-coins-label').text(coinType)
    };
}

$('form').on('submit', function (event) {
    $('#submitAPIkey-button').button('loading');
    APIkey = $('form').serialize().split('=')[1];
});

$('li.dropdown-coins [role="menuitem"]').on('click', function () {
	navigator.notification.vibrate(500);
    $('#dropdown-coins-label').text(this.text)
    coinType = this.text;
    localStorage.setItem('coinType', coinType);
    refreshData();

})

$('.btn-refresh').on('click', function () {
	navigator.notification.vibrate(500);
    refreshData();
})

function submitAPIkey() {
    $.ajax({
        type: "GET",
        url: "http://ypool.net/api/personal_stats?coinType=" + coinType + "&key=" + APIkey,
        success: function (data) {
            var JSONified = JSON.parse(data);
            if (JSONified['status_code'] != 1) {
                $('.form-signin').attr('class', 'form-signin has-error');
                $(".form-signin").append(ajaxFailedAuthenticate);
                $('.btn').button('reset');
            } else {
                localStorage.setItem('APIkey', APIkey);
                $.each(JSONified, function (key, value) {
                    localStorage.setItem(coinType + '_personal_stats_' + key, value);
                    localStorage.setItem('coinType', coinType);
                });
                $.when(
                    ajax_personal_stats(),
                    ajax_global_stats(),
                    ajax_workers(),
                    ajax_live_workers(),
                    ajax_block_stats()
                )
                    .done(function () {
                        closeSignin();
                    })
            }
        },
        error: function () {
            $(".form-signin").append(ajaxFailedConnect);
            $('.btn').button('reset');
        }
    })
}

function ajax_personal_stats() {
    return $.ajax({
        type: "GET",
        url: "http://ypool.net/api/personal_stats?coinType=" + coinType + "&key=" + APIkey,
        success: function (data) {
            var JSONified = JSON.parse(data);
            $.each(JSONified, function (key, value) {
                localStorage.setItem(coinType + '_personal_stats_' + key, value);
            });
        }
    })
}

function ajax_global_stats() {
    return $.ajax({
        type: "GET",
        url: "http://ypool.net/api/global_stats?coinType=" + coinType + "&key=" + APIkey,
        success: function (data) {
            var JSONified = JSON.parse(data);
            $.each(JSONified, function (key, value) {
                localStorage.setItem(coinType + '_global_stats_' + key, value);
            });
        }
    })
}

function ajax_workers() {
    return $.ajax({
        type: "GET",
        url: "http://ypool.net/api/workers?coinType=" + coinType + "&key=" + APIkey,
        success: function (data) {
            var JSONified = JSON.parse(data);
            $.each(JSONified, function (key, value) {
                if (value.length === 'undefined') {
                    localStorage.setItem(coinType + '_' + key, value);
                } else {
                    localStorage.setItem(coinType + '_workers_' + key, JSON.stringify(value));
                }
            });
        }
    })
}

function ajax_live_workers() {
    return $.ajax({
        type: "GET",
        url: "http://ypool.net/api/live_workers?coinType=" + coinType + "&key=" + APIkey,
        success: function (data) {
            var JSONified = JSON.parse(data);
            $.each(JSONified, function (key, value) {
                if (value.length === 'undefined') {
                    localStorage.setItem(coinType + '_' + key, value);
                } else {
                    localStorage.setItem(coinType + '_live_workers_' + key, JSON.stringify(value));
                }
            });
        }
    })
}

function ajax_block_stats() {
    return $.ajax({
        type: "GET",
        url: "http://ypool.net/api/block_stats?coinType=" + coinType + "&key=" + APIkey,
        success: function (data) {
            var JSONified = JSON.parse(data);
            $.each(JSONified, function (key, value) {
                if (value.length === 'undefined') {
                    localStorage.setItem(coinType + '_' + key, value);
                } else {
                    localStorage.setItem(coinType + '_block_stats_' + key, JSON.stringify(value));
                }
            });
        }
    })
}

function closeSignin() {
    $('.container,.form-signin').slideUp(600).promise().done(function () {
        launchApp();
    })
}

function launchApp() {
    $('.navbar').fadeIn(600, function () {}),
    $('.tab-content').fadeIn(600, function () {}),
    $('.tab-pane#personal').tab('show'),
    $('#footer,#footer-container').fadeIn(600, function () {}),
    populateControls()
}

function refreshData() {
    $.when(
        ajax_personal_stats(),
        ajax_global_stats(),
        ajax_workers(),
        ajax_live_workers(),
        ajax_block_stats()
    )
        .done(function () {
            populateControls();
        })
        .fail(function () {
            $(".tab-content").prepend(ajaxFailedConnect);
        })
}

function populateControls() {
    dataDate = new Date()
    $('p[name="data-date"]').text('Last updated: ' + dataDate.toLocaleDateString() + ' ' + dataDate.toLocaleTimeString());

    $('.form-control[name="payment"]').val(localStorage.getItem(coinType + '_personal_stats_paymentAddress'));
    $('.form-control[name="balance"]').val(localStorage.getItem(coinType + '_personal_stats_balance'));
    $('.form-control[name="unconfirmed"]').val(localStorage.getItem(coinType + '_personal_stats_unconfirmedBalance'));
    $('.form-control[name="autopayout"]').val(localStorage.getItem(coinType + '_personal_stats_autoPayoutAmount'));
    $('.form-control[name="donation"]').val(localStorage.getItem(coinType + '_personal_stats_donation') + '%');

    var live_workers_connectedWorkers = JSON.parse(localStorage.getItem(coinType + '_live_workers_connectedWorkers'));
    if (live_workers_connectedWorkers.length) {
        $('#workers-title .badge').text(live_workers_connectedWorkers.length);
    } else {
        $('#workers-title .badge').text('0')
    }

    $('.table#workers-table > tbody > tr').remove();
    $.each(live_workers_connectedWorkers, function () {
        var live_worker_Worker = this.workerName;

        var timeConnected = this.timestampConnect * 1000;
        var timeCurrent = dataDate.getTime();
        var diff = Math.abs(timeCurrent - timeConnected);
        var live_worker_SharesPerHour = this.totalShareValue / diff * 60 * 60 * 1000;

        var live_worker_Shares = this.totalShareValue;
        var live_worker_Version = this.versionString.split('/');
        $('.table#workers-table > tbody:last').append('<tr><td class="worker">' + live_worker_Worker + '</td><td class="shares">' + live_worker_SharesPerHour.toFixed(2) + '</td><td class="version"><a href="javascript:void(0)" data-placement="auto" data-toggle="tooltip" title="' + live_worker_Version[0] + ' > ' + live_worker_Version[1] + '"><span class="glyphicon glyphicon-info-sign"></span></a></td></tr>');
    });

    $('[data-toggle="tooltip"]').tooltip();

    block_stats_data = [
        []
    ];
    var block_stats_lastBlocksFound = JSON.parse(localStorage.getItem(coinType + '_block_stats_lastBlocksFound'));
    $.each(block_stats_lastBlocksFound, function () {
        block_stats_data[0].push([this.blockHeight, this.personalBlockYield])
    });

    var block_stats_data_ymin = Math.min.apply(null, block_stats_lastBlocksFound.map(function (k) {
        return k.personalBlockYield
    })).toPrecision(1);
    flot_ymin = Number(block_stats_data_ymin) - Number(block_stats_data_ymin.replace(block_stats_data_ymin.slice(-1), '1'));
    var block_stats_data_ymax = Math.max.apply(null, block_stats_lastBlocksFound.map(function (k) {
        return k.personalBlockYield
    })).toPrecision(1);
    flot_ymax = Number(block_stats_data_ymax) + Number(block_stats_data_ymax.replace(block_stats_data_ymax.slice(-1), '1'));

    flot_options = {
        yaxis: {
            min: flot_ymin,
            max: flot_ymax
        },
        xaxis: {
            ticks: 4
        },
        series: {
            lines: {
                show: true,
                lineWidth: 1,
                fill: true,
                fillColor: "rgba(250, 250, 250, 0.8)"
            },
            points: {
                show: true,
                fill: false
            }
        },
        colors: ["#000"]
    };

    $.plot($("#block-performance-placeholder"), block_stats_data, flot_options);

    $('.form-control[name="numworkers"]').val(localStorage.getItem(coinType + '_global_stats_connectedWorkers'));
    $('.form-control[name="shares"]').val(localStorage.getItem(coinType + '_global_stats_sharesPerSecond'));
    $('.form-control[name="difficulty"]').val(localStorage.getItem(coinType + '_global_stats_difficulty'));

    $('.table#blocksfound-table > tbody > tr').remove();
    $('.table#blocksfound-table > tbody:last').append(
        '<tr><td id="hr1">' + localStorage.getItem(coinType + '_global_stats_blocksFound_1h') +
        '</td><td id="hr3">' + localStorage.getItem(coinType + '_global_stats_blocksFound_3h') +
        '</td><td id="hr6">' + localStorage.getItem(coinType + '_global_stats_blocksFound_6h') +
        '</td><td id="hr12">' + localStorage.getItem(coinType + '_global_stats_blocksFound_12h') +
        '</td><td id="hr24">' + localStorage.getItem(coinType + '_global_stats_blocksFound_24h') +
        '</td><td id="hr48">' + localStorage.getItem(coinType + '_global_stats_blocksFound_48h') +
        '</td></tr>'
    );
}