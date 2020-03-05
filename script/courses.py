import re
import json
import requests
from bs4 import BeautifulSoup  # import html5lib

matcher = re.compile(r'([A-Z]+( [A-Z]+)?) (\d+) (.*?) \((.*)\)( (.*))?')

def main():
    result = dict()
    for campus in ['crscat', 'crscatb', 'crscatt']:  # Seattle, Bothell, Tacoma
        parse_campus(campus, result)
    with open('courses.json', 'w') as fp:
        json.dump(result, fp)
        print(f"Exported {len(result)} Departments")

def parse_campus(campus, result):
    r = requests.get(f'https://www.washington.edu/students/{campus}/')
    soup = BeautifulSoup(r.text, 'html5lib') # Handle broken HTML
    departments = [
        a['href'] for a in soup.find("div", 'uw-content').find_all('a') 
        if a['href'].endswith('.html') and '/' not in a['href']
    ]
    for department in departments:
        parse(campus, department, result)

def parse(campus, department, result):
    r = requests.get(f'https://www.washington.edu/students/{campus}/{department}')
    soup = BeautifulSoup(r.text, 'html.parser')
    for course in soup.find_all('b'):
        course = extract(course.text)
        depart = course["department"]
        num = course["number"]
        info = course["info"]
        if depart not in result:
            result[depart] = dict()
        result[depart][num] = info

def extract(title):
    groups = matcher.search(title).groups()
    return {
        "department": groups[0],
        "number": groups[2],
        "info": {
            "name": ' '.join(groups[3].split()),
            "credits": groups[4],
            "satisfy": groups[6]
        }
    }

if __name__ == "__main__":
    main()
