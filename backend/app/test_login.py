import requests


def test_login():
    url = "http://localhost:8000/auth/login"
    payload = {"email": "testuser3@example.com", "password": "demo123"}
    r = requests.post(url, json=payload)
    print("status:", r.status_code)
    try:
        print(r.json())
    except Exception:
        print(r.text)


if __name__ == "__main__":
    test_login()
