importScripts("https://cdnjs.cloudflare.com/ajax/libs/fuse.js/3.4.6/fuse.min.js")
var evaluations = [];
var courses = [];
var globalFuse;
const options = {
    shouldSort: true,
    tokenize: true,
    threshold: 0.6,
    location: 0,
    distance: 10,
    maxPatternLength: 30,
    minMatchCharLength: 3,
    keys: ["department", "course", "section", "name", "facultyName"]
};

function loadData(then) {
    fetch("../data/courses.json")
        .then(res => res.json())
        .then((json) => {
            courses = json;
            fetch("../data/cec.json")
                .then(res => res.json())
                .then((json) => {
                    for (const evaluation of json) {
                        let name = null;
                        let campus = null;
                        const department = evaluation.department;
                        const courseNumber = evaluation.course;
                        if (department in courses) {
                            allDepartmentalCourses = courses[department]
                            if (courseNumber in allDepartmentalCourses) {
                                name = allDepartmentalCourses[courseNumber]['name']
                                campus = allDepartmentalCourses[courseNumber]['campus']
                            }
                        }
                        evaluation['campus'] = campus;
                        evaluation['name'] = name;
                    }
                    evaluations = json;
                    console.log(evaluations);
                    globalFuse = new Fuse(evaluations, options);
                    if (then) then();
                })
        })
        .catch(err => { throw err });
}

onmessage = function(event) {
    const query = event.data.query;
    const urlParams = event.data.urlParams
    let filters;
    if (urlParams && urlParams != "?") {
        filters = new URLSearchParams(urlParams);
    }
    if (query == "init") {
        loadData(() => {
            search(null, filters);
        })
    } else {
        search(query, filters);
    }
}

function search(query, filters) {
    if (filters && [...filters.entries()].length) {
        const campus = new Set(filters.getAll("campus"));
        const hasFilterCampus = campus.size;
        const quarter = new Set(filters.getAll("quarter"));
        const hasFilterQuarter = quarter.size;
        const department = new Set(filters.getAll("dept"));
        const hasFilterDepartment = department.size;
        const filtered = evaluations.filter(evaluation => {
            if (hasFilterCampus) {
                if (!campus.has(evaluation.campus)) {
                    return false
                }
            }
            if (hasFilterQuarter) {
                if (!quarter.has(evaluation.quarter)) {
                    return false
                }
            }
            if (hasFilterDepartment) {
                if (!department.has(evaluation.department)) {
                    return false
                }
            }
            return true
        });
        if (query) {
            const fuse = new Fuse(filtered, options);
            const result = fuse.search(query);
            console.log("result")
            postMessage(result)
        } else {
            console.log("filtered")
            postMessage(filtered);
        }
    } else {
        if (query) {
            console.log(query);
            const result = globalFuse.search(query);
            postMessage(result);
            console.log("all");
        } else {
            console.log("Yousa?")
        }
    }
}