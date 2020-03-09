var myWorker = new Worker('./js/search.js');

var previousWidth = null;

function collapseFiltersIfNeeded() {
    const isOnMobile = (width) => width < 767;
    const width = $(window).width()
    if (isOnMobile(width)) {
        if (!isOnMobile(previousWidth)) {
            $('#filters').removeAttr('open');
        }
    } else {
        if (isOnMobile(previousWidth)) {
            $('#filters').attr('open', '');
        }
    }
    previousWidth = width
}

$(function() {
    myWorker.postMessage({
        "query": "init",
        "urlParams": window.location.search
    })
    $(window).resize($.debounce(500, collapseFiltersIfNeeded));
    collapseFiltersIfNeeded();
});

$("a[data-dept]").click((e) => {
    let url = window.location.href;
    const dept = e.currentTarget.getAttribute('data-dept');
    if (url.indexOf('?') > -1) {
        url += `&dept=${dept}`
    } else {
        url += `?dept=${dept}`
    }
    window.location.href = url;
});

var lang = localStorage.getItem('language');
$('#languages').dropdown({
    fullTextSearch: true,
    onChange: (value) => {
        localStorage.setItem('language', value)
        if (value == "en") {
            if (lang != value) {
                location.reload();
            }
        } else {
            $("[data-localize]")
                .localize("i18n/application", { language: value })
                .localize("i18n/departments", { language: value });
        }
        $(".departments").removeClass(lang).addClass(value)
        lang = value;
    }
}).dropdown('set selected', lang);

$("#searchButton").click(populateResults);
$('#searchBar').keyup($.throttle(750, populateResults));

function populateResults() {
    const query = $("#searchBar").val();
    if (query) {
        myWorker.postMessage({
            "query": query,
            "urlParams": window.location.search
        });
    } else {
        $("#departments").slideDown()
        $('#searchResult').hide()
        $('#pagination').hide()
    }
}

myWorker.onmessage = function(event) {
    const result = event.data;
    if (result) {
        $('#pagination').pagination({
            dataSource: result,
            callback: function(evaluations, pagination) {
                const html = showEvaluations(evaluations);
                $('#searchResult').html(html);
            }
        })
        $('#pagination').show()
        $('#searchResult').show()
    }
    $("#departments").slideUp()
}

function groupBy(list, keyGetter) {
    const map = new Map();
    list.forEach((item) => {
        const key = keyGetter(item);
        const collection = map.get(key);
        if (!collection) {
            map.set(key, [item]);
        } else {
            collection.push(item);
        }
    });
    return map;
}

function showEvaluations(evaluations) {
    const categorized = groupBy(evaluations, evaluation => `${evaluation.department} ${evaluation.course}`)
    let html = '';
    for (const [fullCourseName, evaluations] of categorized.entries()) {
        let innerHTML = ""
        let name;
        $.each(evaluations, function(idx, evaluation) {
            name = evaluation.name;
            innerHTML += showEvaluation(evaluation);
        });
        if (!name) name = "<emphasis>(No Longer Offered)</emphasis>";
        html += `
            <h3>
                ${fullCourseName} ${name}
                <span class="right">
                    View in 
                    <a href="https://myplan.uw.edu/course/#/courses/${fullCourseName}" target="_blank">
                    MyPlan
                    </a>
                </span>
            </h3>
            <ul>${innerHTML}</ul>
        `
    }
    return html;
}

function showEvaluation(evaluation) {
    return `
        <li class="evaluation-entry">
            <a href="https://www.washington.edu/cec/${evaluation.url}">
                <span>${evaluation.quarter}</span>
                <span>Section ${evaluation.section}</span>
                by
                <span>${evaluation.facultyName} (${evaluation.facultyType})</span>
            </a>
        </li>
    `
}