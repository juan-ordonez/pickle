from __future__ import print_function
import sys
import os
import urllib

# Import flask dependencies
from flask import Blueprint, request, render_template, \
                  flash, g, session, redirect, url_for

# Import password / encryption helper tools
from werkzeug import check_password_hash, generate_password_hash

# Import the database object from the main app module
from app import db
from app import app, crossdomain

# Import module forms
from app.mod_auth.forms import LoginForm, RegistrationForm, RemoveForm

# Import module models (i.e. User)
from app.mod_auth.models import User, Comment

from flask_login import LoginManager, login_user, login_required, logout_user, current_user, user_logged_in, current_user

from run import login_manager

from instagram.client import InstagramAPI
from BeautifulSoup import BeautifulSoup


from collections import Counter
from datetime import datetime



import ujson as json
import argparse

from google.cloud import language
from google.cloud.language import enums
from google.cloud.language import types
from oauth2client.client import GoogleCredentials
from twilio.twiml.voice_response import Reject, VoiceResponse, Say, Dial, Number
import ast
credentials = GoogleCredentials.get_application_default()

instagram_access_token = '22061997.f474111.9666e524ddb140608d124b554fb8bda0'
facebook_access_token = '1430922756976623|b9CHdj7HQEPluzKIqZosLTnTaJQ'
google_places_access_token = 'AIzaSyAokrPlw45fd-jNzarVz09OPNVXRB2kdTg'



mod_auth = Blueprint('auth', __name__, url_prefix='')


instaConfig = {

    'client_id': 'f47411163bd6493bae1667a70e793fb5',
    'client_secret': '76b892dd1f054d9fba7afcdc2c5d7f18',
    'redirect_uri' : 'https://damp-cliffs-30092.herokuapp.com/auth/instagram_callback'

}
api = InstagramAPI(**instaConfig)



@mod_auth.route('/', methods=['GET', 'POST'])
def home():
    return render_template('auth/parent.html')



#Registration controller
@mod_auth.route('/register/', methods=['POST'])
@crossdomain(origin='*')
def register():
    user = User.query.filter_by(id=request.form['id']).first()

    if not user:
        create = User(request.form['id'], request.form['name'], request.form['email'])
    
        db.session.add(create)
        db.session.commit()

    return str(request.form.to_dict())

@mod_auth.route('/comment/', methods=['POST'])
@crossdomain(origin='*')
def comment():
    comment = Comment(request.form['string'], request.form['url'], str(datetime.now()))
    user = User.query.filter_by(id=request.form['userId']).first()
    user.commentsWritten.append(comment)
    db.session.add(user)
    db.session.add(comment)
    tags = ast.literal_eval(str(request.form['tags']))
    for tag in tags:
        taggedUser = User.query.filter_by(id=tag).first()
        taggedUser.commentsTaggedIn.append(comment)
    db.session.commit()
    return str("Comment added")


    





# #Delete account controller
# @mod_auth.route("/remove/", methods=['GET','POST'])
# @login_required
# def remove():
#     if request.method == 'GET':
#         return render_template('auth/remove.html', username=current_user.email)
#     #Check that email is correct
#     if not(current_user.email == request.form['email']):
#         flash("Error: Email or password is incorrect.")
#         return render_template('auth/remove.html', username=current_user.email)
#     #Check that password is correct
#     if not(request.form['password'] == current_user.password):
#         flash("Error: Email or password is incorrect.")
#         return render_template('auth/remove.html', username=current_user.email)
#     #Check that passwords match
#     if not(request.form['password'] == request.form['passwordRepeat']):
#         flash("Error: Passwords do not match.")
#         return render_template('auth/remove.html', username=current_user.email)
#     user = User.query.filter_by(email=request.form['email']).first()
#     logout_user()
#     db.session.delete(user)
#     db.session.commit()
#     return redirect(url_for('auth.removeSuccess', email=user.email))

# #Dashboard controller
# @mod_auth.route("/dashboard", methods=['GET','POST'])
# @login_required
# def dashboard():
#     likes = 0   #total likes
#     comments = 0 #total comments
#     posts = 0 #total posts
#     media = []
#     names = []
#     pictures = []  
#     numPostsArray = []  #posts per influencer
#     likesArray = []     #likes per influencer
#     commentsArray = [] #comments per influencer
#     totalPostsArray = []
#     totalLikesArray = []
#     totalCommentsArray = []
#     stars = []
#     engagement = []

#     # if session.get('instagram_access_token') and session.get('instagram_user'):
#     # userAPI = InstagramAPI(access_token=session['instagram_access_token'])
#     # recent_media, next = userAPI.user_recent_media(user_id=session['instagram_user'].get('id'),count=25)
    
#     templateData = influencerLoop(current_user.influencers, likes, comments, posts, media, names, pictures, numPostsArray, likesArray, 
#         commentsArray, totalPostsArray, totalLikesArray, totalCommentsArray, engagement, stars, current_user)

#     return render_template('auth/dashboard.html', **templateData)
#     # else:
#     #     return redirect(url_for('auth.user_photos'))


# @mod_auth.route("/remove/<email>", methods=['GET','POST']) 
# def removeSuccess(email):
#     flash(email + "'s account has been removed.")
#     return redirect(url_for("auth.register"))



# #Adding new Influencer
# @mod_auth.route("/addinfluencer", methods=['GET','POST'])
# @login_required
# def add():
#     influencer = Influencer(request.form['handle'], None)
#     followers = request.form['followers']
#     influencer.followers = followers
#     influencer.users.append(current_user)
#     db.session.add(influencer)
#     db.session.commit()
#     flash("Influencer has been added")
#     return redirect(url_for('auth.manage'))

# #Removing Influencer
# @mod_auth.route("/removeinfluencer", methods=['GET','POST'])
# @login_required
# def removeInfluencer():
#     influencer = Influencer.query.filter_by(handle=request.form['handle']).first()
#     for lead in influencer.leads:
#         db.session.delete(lead)
#     current_user.influencers.remove(influencer)
#     db.session.delete(influencer)
#     db.session.commit()
#     flash("Influencer has been removed")
#     return redirect(url_for('auth.manage'))

