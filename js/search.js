importScripts("https://cdnjs.cloudflare.com/ajax/libs/fuse.js/3.4.6/fuse.min.js")
var evaluations = []
var courses = []
var fuse;
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

function loadData() {
    fetch("../data/courses.json")
        .then(res => res.json())
        .then((json) => {
            courses = json;
            fetch("../data/cec.json")
                .then(res => res.json())
                .then((json) => {
                    for (var evaluation of json) {
                        let name = null;
                        const department = evaluation.department;
                        const courseNumber = evaluation.course;
                        if (department in courses) {
                            allDepartmentalCourses = courses[department]
                            if (courseNumber in allDepartmentalCourses) {
                                name = allDepartmentalCourses[courseNumber]['name']
                            }
                        }
                        evaluation['name'] = name
                    }
                    evaluations = json;
                    fuse = new Fuse(evaluations, options);
                })
        })
        .catch(err => { throw err });
}

onmessage = function(event) {
    const query = event.data.query;
    const filters = new URLSearchParams(event.data.urlParams);

    if (query == "init") {
        loadData()
    } else {
        const result = fuse.search(query);
        postMessage(result);
    }
}