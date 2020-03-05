"""
We need your login to get data from UW CEC. For example:

uwnetid = "zhuzhiyu"
password = "yourPassword"

Now, put your info between quotes:
""" 

uwnetid = "REPLACE WITH YOUR UW NET ID"
password = "REPLACE WITH YOUR PASSWORD"

################################################################################
#                                                                              #
#   THANKS. You may now run this Python script.                                #
#   Do NOT touch anything below unless you know what you're doing.             #
#                                                                              #
################################################################################

import requests
from bs4 import BeautifulSoup
from http.cookies import SimpleCookie
import getpass

if uwnetid == "REPLACE WITH YOUR UW NET ID":
    uwnetid = input("Your UW NetID: ")

if password == "REPLACE WITH YOUR PASSWORD":
    password = getpass.getpass()

session = requests.Session()
r = session.get("https://www.washington.edu/cec/toc.html")
soup = BeautifulSoup(r.text, 'html.parser')
if soup.find("h1", text="Shibboleth Authentication Request"):
    data = {
        "RelayState": soup.find("input", attrs={"name":"RelayState"})["value"],
        "SAMLRequest": soup.find("input", attrs={"name":"SAMLRequest"})["value"],
    }
    login = session.post("https://idp.u.washington.edu/idp/profile/SAML2/POST/SSO", data=data)
    soup = BeautifulSoup(login.text, 'html.parser')
    path = soup.find(id='idplogindiv')['action']
    url = f"https://idp.u.washington.edu{path}"
    data = {
        "j_username": uwnetid,
        "j_password": password,
        "_eventId_proceed": "Sign in"
    }
    complete = session.post(url, data=data)
    soup = BeautifulSoup(complete.text, 'html.parser')
    url = soup.find("form")['action']
    data = {
        "RelayState": soup.find("form").find("input", attrs={"name":"RelayState"})["value"],
        "SAMLResponse": soup.find("form").find("input", attrs={"name":"SAMLResponse"})["value"],
    }
    ece = session.post(url, data=data)
    r = session.get("https://www.washington.edu/cec/toc.html")
    soup = BeautifulSoup(r.text, 'html.parser')
if soup.find("h1", text="Course Evaluation Catalog Table of Contents"):
    print("Login Successful")
else:
    print("Login Failed! :(")

import requests_cache
requests_cache.install_cache('demo_cache')

def fetch(letter):
    r = session.get(f"https://www.washington.edu/cec/{letter}-toc.html")
    soup = BeautifulSoup(r.text, 'html.parser')
    result = []
    for element in soup.find_all('a'):
        url = element['href']
        if url.startswith(letter+"/"):
            info = [part.strip() for part in element.string.split(u'\xa0\xa0')] 
            comp = info[0].split()
            course = comp[-2]
            condensed_department = url[2:url.find(course)]
            count = len(condensed_department)
            for i in reversed(range(len(comp) - 2)):
                count -= len(comp[i])
                if count == 0:
                    break
            result.append({
                "url": url,
                "school": ' '.join(comp[:i]),
                "department": ' '.join(comp[i:-2]),
                "course": course,
                "section": comp[-1],
                "facultyName": info[1],
                "facultyType": info[2],
                "quarter": info[3]
            })
    return result

result = []
for first_letter in "qwertyuiopasdfghjklzxcvbnm":
    result += fetch(first_letter)

import json
with open('cec.json', 'w') as fp:
    json.dump(result, fp)
    print(f"Exported {len(result)} Course Evaluations")