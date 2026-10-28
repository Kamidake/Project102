import os
import requests

# Retrieve credentials from GitHub Secrets
username = os.environ.get("M3U_USERNAME")
password = os.environ.get("M3U_PASSWORD")

login_url = "https://m3u.in/api/account/login/"
login_payload = {
    "username": username,
    "password": password
}

login_response = requests.post(login_url, json=login_payload)

if login_response.status_code == 200:
    fresh_token = login_response.json().get("access")
    print("Successfully retrieved new token.")

    update_url = "https://m3u.in/api/pl/248280/update_from_origin/"
    update_headers = {
        "authorization": f"Bearer {fresh_token}",
        "accept": "application/json, text/plain, */*",
        "origin": "https://app.m3u.in"
    }

    update_response = requests.put(update_url, headers=update_headers)
    print(f"Update Status: {update_response.status_code}")
    print(f"Update Response: {update_response.text}")

else:
    print(f"Login failed. Status: {login_response.status_code}")
    print(login_response.text)
