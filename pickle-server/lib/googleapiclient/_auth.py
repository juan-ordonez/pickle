# Copyright 2016 Google Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Helpers for authentication using oauth2client or google-auth."""

import httplib2

try:
    import google.auth
    import google.auth.credentials
    import google_auth_httplib2
    HAS_GOOGLE_AUTH = True
except ImportError:  # pragma: NO COVER
    HAS_GOOGLE_AUTH = False

try:
    import oauth2client
    import oauth2client.client
    HAS_OAUTH2CLIENT = True
except ImportError:  # pragma: NO COVER
    HAS_OAUTH2CLIENT = False


def default_credentials():
    """Returns Application Default Credentials."""
    if HAS_GOOGLE_AUTH:
        credentials, _ = google.auth.default()
        return credentials
    elif HAS_OAUTH2CLIENT:
        return oauth2client.client.GoogleCredentials.get_application_default()
    else:
        raise EnvironmentError(
            'No authentication library is available. Please install either '
            'google-auth or oauth2client.')


def with_scopes(credentials, scopes):
    """Scopes the credentials if necessary.

    Args:
        credentials (Union[
            google.auth.credentials.Credentials,
            oauth2client.client.Credentials]): The credentials to scope.
        scopes (Sequence[str]): The list of scopes.

    Returns:
        Union[google.auth.credentials.Credentials,
            oauth2client.client.Credentials]: The scoped credentials.
    """
    if HAS_GOOGLE_AUTH and isinstance(
            credentials, google.auth.credentials.Credentials):
        return google.auth.credentials.with_scopes_if_required(
            credentials, scopes)
    else:
        try:
            if credentials.create_scoped_required():
                return credentials.create_scoped(scopes)
            else:
                return credentials
        except AttributeError:
            return credentials


def authorized_http(credentials):
    """Returns an http client that is authorized with the given credentials.

    Args:
        credentials (Union[
            google.auth.credentials.Credentials,
            oauth2client.client.Credentials]): The credentials to use.

    Returns:
        Union[httplib2.Http, google_auth_httplib2.AuthorizedHttp]: An
            authorized http client.
    """
    from googleapiclient.http import build_http

    if HAS_GOOGLE_AUTH and isinstance(
            credentials, google.auth.credentials.Credentials):
        return google_auth_httplib2.AuthorizedHttp(credentials,
                                                   http=build_http())
    else:
        return credentials.authorize(build_http())


def refresh_credentials(credentials):
    # Refresh must use a new http instance, as the one associated with the
    # credentials could be a AuthorizedHttp or an oauth2client-decorated
    # Http instance which would cause a weird recursive loop of refreshing
    # and likely tear a hole in spacetime.
    refresh_http = httplib2.Http()
    if HAS_GOOGLE_AUTH and isinstance(
            credentials, google.auth.credentials.Credentials):
        request = google_auth_httplib2.Request(refresh_http)
        return credentials.refresh(request)
    else:
        return credentials.refresh(refresh_http)


def apply_credentials(credentials, headers):
    # oauth2client and google-auth have the same interface for this.
    return credentials.apply(headers)


def is_valid(credentials):
    if HAS_GOOGLE_AUTH and isinstance(
            credentials, google.auth.credentials.Credentials):
        return credentials.valid
    else:
        return not credentials.access_token_expired


def get_credentials_from_http(http):
    if http is None:
        return None
    elif hasattr(http.request, 'credentials'):
        return http.request.credentials
    elif (hasattr(http, 'credentials')
          and not isinstance(http.credentials, httplib2.Credentials)):
        return http.credentials
    else:
        return None
