var myWorker = new Worker('./js/search.js');
var myFormatter = new Worker('./js/formatter.js');
var selectedDepartments = new Set();

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
    const urlParams = window.location.search;
    const filters = new URLSearchParams(urlParams);
    for (const filter of filters) {
        $(`#${filter[1]}`).attr('checked', 'checked');
    }
    selectedDepartments = new Set(filters.getAll("dept"));
    populateSelectedDepartmentDisplay();
    myWorker.postMessage({
        "query": "init",
        "urlParams": urlParams
    })
    $(window).resize($.debounce(500, collapseFiltersIfNeeded));
    collapseFiltersIfNeeded();
    $(window).keydown(function(event) {
        if (event.keyCode == 13) {
            event.preventDefault();
            return false;
        }
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
            $("[data-localize]")
                .localize("i18n/application", { language: value })
                .localize("i18n/departments", { language: value });
        }
        $(".departments").removeClass(lang).addClass(value)
        lang = value;
    }
}).dropdown('set selected', lang);

$("#searchButton").click(() => populateResults(true));
$('#searchBar').keyup($.throttle(500, populateResults));

$("#not-found").hide()

function populateResults(force) {
    let query = $("#searchBar").val();
    if (force && !query) {
        query = "search";
    }
    if (query) {
        myWorker.postMessage({
            "query": query,
            "urlParams": $("#filters-form").serialize()
        });
    } else {
        $("#departments").slideDown()
        $("#not-found").hide()
        $('#searchResult').hide()
        $('#pagination').hide()
    }
}

myWorker.onmessage = function(event) {
    const result = event.data;
    const found = result && result.length;
    if (found) {
        $('#pagination').pagination({
            dataSource: result,
            callback: function(evaluations, pagination) {
                myFormatter.postMessage(evaluations)
            }
        })
        $('#pagination').show()
        $('#searchResult').show()
        $("#not-found").hide()
    }
    $("#departments").slideUp()
    if (!found) {
        $("#not-found").show()
    }
}

myFormatter.onmessage = function(event) {
    $('#searchResult').html(event.data);
}

$('input[name=dept]').click(function(e) {
    const value = $(this).attr('value');
    if ($(this).prop("checked")) {
        selectedDepartments.add(value);
    } else {
        selectedDepartments.delete(value);
    }
    populateSelectedDepartmentDisplay();
});

$("#dept-filters").hide();
$(document).on("click", "i[data-dept]", function(e) {
    const department = this.getAttribute('data-dept')
    selectedDepartments.delete(department);
    $(`#${department}`).prop("checked", false);
    populateSelectedDepartmentDisplay();
});

function populateSelectedDepartmentDisplay() {
    let html = ""
    for (const department of selectedDepartments) {
        html += `
            <div class="ui image label" >
                ${department}
                <i class="delete icon" data-dept="${department}"></i>
            </div>
        `;
    }
    $("#selected-departments").html(html);
    if (selectedDepartments.size) {
        $("#dept-filters").slideDown();
    } else {
        $("#dept-filters").slideUp();
    }
}