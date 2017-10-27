# Statement for enabling the development environment


# Define the application directory
import os
  
import pymysql
pymysql.install_as_MySQLdb()
BASE_DIR = os.path.abspath(os.path.dirname(__file__))




# Application threads. A common general assumption is
# using 2 per available processor cores - to handle
# incoming requests using one and performing background
# operations using the other.
THREADS_PER_PAGE = 2

# Enable protection agains *Cross-site Request Forgery (CSRF)*
CSRF_ENABLED     = True

# Use a secure, unique and absolutely secret key for
# signing the data. 
CSRF_SESSION_KEY = "secret"

# Secret key for signing cookies
SECRET_KEY = "secret"

SEND_FILE_MAX_AGE_DEFAULT = 0

DATA_BACKEND = 'datastore'

CLOUDSQL_USER = 'root'
CLOUDSQL_PASSWORD = 'pik0l0'
CLOUDSQL_DATABASE = 'users_db'
# Set this value to the Cloud SQL connection name, e.g.
#   "project:region:cloudsql-instance".
# You must also update the value in app.yaml.
CLOUDSQL_CONNECTION_NAME = 'pickle-server-183401:us-west1:users-db'

SQLALCHEMY_DATABASE_URI = (
    'mysql+pymysql://{user}:{password}@/{database}'
    '?unix_socket=/cloudsql/{connection_name}').format(
        user=CLOUDSQL_USER, password=CLOUDSQL_PASSWORD,
        database=CLOUDSQL_DATABASE, connection_name=CLOUDSQL_CONNECTION_NAME)
DATABASE_CONNECT_OPTIONS = {}
