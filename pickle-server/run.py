# Run a test server.
import os
import gunicorn
from app import app
from flask_login import login_manager, LoginManager
from flask import url_for, render_template, Flask
from app.mod_auth.models import User


login_manager = LoginManager()
login_manager.init_app(app)
@login_manager.user_loader
def load_user(user_id):
    return User.query.get(str(user_id))




