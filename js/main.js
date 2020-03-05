var evaluations = []
var courses = []
var fuse;
var options = {
    shouldSort: true,
    tokenize: true,
    threshold: 0.6,
    location: 0,
    distance: 10,
    maxPatternLength: 30,
    minMatchCharLength: 3,
    keys: ["department", "course", "section", "name", "facultyName"]
};
$(function() {
    $.getJSON("./data/courses.json", function(json) {
        courses = json;
        $.getJSON("./data/cec.json", function(json) {
            $.each(json, function(idx, evaluation) {
                var name = null;
                const department = evaluation.department;
                const courseNumber = evaluation.course;
                if (department in courses) {
                    allDepartmentalCourses = courses[department]
                    if (courseNumber in allDepartmentalCourses) {
                        name = allDepartmentalCourses[courseNumber]['name']
                    }
                }
                evaluation['name'] = name
            });
            evaluations = json;
            fuse = new Fuse(evaluations, options);
        });
    });
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
            $("[data-localize]").localize("i18n/application", { language: value });
        }
        lang = value;
    }
}).dropdown('set selected', lang);

$('#searchBar').keyup($.throttle(750, populateResults));

function populateResults() {
    var query = $("#searchBar").val();
    if (query) {
        var result = fuse.search(query);
        if (result) {
            $('#pagination').pagination({
                dataSource: result,
                showGoInput: true,
                formatGoInput: 'jump to page <%= input %>',
                callback: function(evaluations, pagination) {
                    var html = showEvaluations(evaluations);
                    $('#searchResult').html(html);
                }
            })
            $('#pagination').show()
            $('#searchResult').show()
        }
        $("#departments").slideUp()
    } else {
        $("#departments").slideDown()
        $('#searchResult').hide()
        $('#pagination').hide()
    }
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
    var html = '<ul>';
    for (const [fullCourseName, evaluations] of categorized.entries()) {
        var innerHTML = ""
        var name;
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
    return html + '</ul>';
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