❌ 오류 발생: ('invalid_grant: Invalid JWT Signature.', {'error': 'invalid_grant', 'error_description': 'Invalid JWT Signature.'})
Traceback (most recent call last):
  File "C:\Users\growthmaker\Desktop\marketing-dashboard_new - 백업\scripts\fetch_creative_sheets.py", line 75, in fetch_creative_sheets_data
    spreadsheet = client.open_by_key(sheet_id)
  File "C:\Users\growthmaker\AppData\Local\Programs\Python\Python314\Lib\site-packages\gspread\client.py", line 206, in open_by_key
    spreadsheet = Spreadsheet(self, {"id": key})
  File "C:\Users\growthmaker\AppData\Local\Programs\Python\Python314\Lib\site-packages\gspread\spreadsheet.py", line 37, in __init__
    metadata = self.fetch_sheet_metadata()
  File "C:\Users\growthmaker\AppData\Local\Programs\Python\Python314\Lib\site-packages\gspread\spreadsheet.py", line 247, in fetch_sheet_metadata
    r = self.client.request("get", url, params=params)
  File "C:\Users\growthmaker\AppData\Local\Programs\Python\Python314\Lib\site-packages\gspread\client.py", line 80, in request
    response = getattr(self.session, method)(
        endpoint,
    ...<5 lines>...
        timeout=self.timeout,
    )
  File "C:\Users\growthmaker\AppData\Local\Programs\Python\Python314\Lib\site-packages\requests\sessions.py", line 602, in get
    return self.request("GET", url, **kwargs)
           ~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\growthmaker\AppData\Local\Programs\Python\Python314\Lib\site-packages\google\auth\transport\requests.py", line 535, in request
    self.credentials.before_request(auth_request, method, url, request_headers)
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\growthmaker\AppData\Local\Programs\Python\Python314\Lib\site-packages\google\auth\credentials.py", line 228, in before_request
    self._blocking_refresh(request)
    ~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^
  File "C:\Users\growthmaker\AppData\Local\Programs\Python\Python314\Lib\site-packages\google\auth\credentials.py", line 191, in _blocking_refresh
    self.refresh(request)
    ~~~~~~~~~~~~^^^^^^^^^
  File "C:\Users\growthmaker\AppData\Local\Programs\Python\Python314\Lib\site-packages\google\auth\credentials.py", line 365, in refresh
    self._refresh_token(request)
    ~~~~~~~~~~~~~~~~~~~^^^^^^^^^
  File "C:\Users\growthmaker\AppData\Local\Programs\Python\Python314\Lib\site-packages\google\oauth2\service_account.py", line 459, in _refresh_token
    access_token, expiry, _ = _client.jwt_grant(
                              ~~~~~~~~~~~~~~~~~^
        request, self._token_uri, assertion
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    )
    ^
  File "C:\Users\growthmaker\AppData\Local\Programs\Python\Python314\Lib\site-packages\google\oauth2\_client.py", line 299, in jwt_grant
    response_data = _token_endpoint_request(
        request,
    ...<5 lines>...
        },
    )
  File "C:\Users\growthmaker\AppData\Local\Programs\Python\Python314\Lib\site-packages\google\oauth2\_client.py", line 270, in _token_endpoint_request
    _handle_error_response(response_data, retryable_error)
    ~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\growthmaker\AppData\Local\Programs\Python\Python314\Lib\site-packages\google\oauth2\_client.py", line 69, in _handle_error_response
    raise exceptions.RefreshError(
        error_details, response_data, retryable=retryable_error
    )
google.auth.exceptions.RefreshError: ('invalid_grant: Invalid JWT Signature.', {'error': 'invalid_grant', 'error_description': 'Invalid JWT Signature.'})