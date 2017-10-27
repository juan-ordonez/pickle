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
from app.mod_auth.models import User, Comment, Session

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
from selenium import webdriver

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

@mod_auth.route('/login/', methods=['GET', 'POST'])
@crossdomain(origin='*')
def login():
    return render_template('auth/login.html')

@mod_auth.route('/connect/', methods=['GET', 'POST'])
@crossdomain(origin='*')
def connect():
    return render_template('auth/parent.html')
    

@mod_auth.route('/check/', methods=['GET', 'POST'])
@crossdomain(origin='*')
def check():
    # driver = webdriver.Chrome("lib/chromedriver") 
    # # driver.add_cookie(request.cookies)
    # for cookie in request.cookies.keys():
    #     print (cookie, request.cookies[cookie])
    #     driver.add_cookie({'name' : cookie, 'value' : request.cookies[cookie], 'secure' : True, "domain" : "http://pickle-server-183401.appspot.com/"})
    # driver.get("http://pickle-server-183401.appspot.com/connect/")
    # json = driver.find_element_by_tag_name('p').get_attribute('innerHTML')
    # driver.quit()

    return 




#Registration controller
@mod_auth.route('/register/', methods=['POST'])
@crossdomain(origin='*')
def register():
    data = json.loads(request.form['json'])

    if data['status']:
        
        user = User.query.filter_by(id=data['id']).first()
        user.updated = True

        if not user:
            create = User(data['id'], data['name'], data['email'])
            create.updated = True
            for friend in data['friends']:
                friendObject = User.query.filter_by(id=friend['id']).first()
                if friendObject:
                    friendObject.updated = False
        
            db.session.add(create)
            
        session = Session.query.filter_by(cookie=request.cookies["fbsr_1430922756976623"]).first()
        if not session:
            session = Session(request.cookies["fbsr_1430922756976623"], data['id'], data['name'], data['email'])
            db.session.add(session)
        
        
        if data['friends']:
            print(data['friends'])
            for friend in data['friends']:
                userFriend = User.query.filter_by(id=friend['id']).first()
                if userFriend and userFriend not in session.friends:
                    session.friends.append(userFriend)

    db.session.commit()


    return json.dumps(request.json)


@mod_auth.route('/user/<cookie>', methods=['GET'])
@crossdomain(origin='*')
def user(cookie):
    session = Session.query.filter_by(cookie=cookie).first()
    if not session:
        return json.dumps({"status" : False})


    user = User.query.filter_by(id=session.id).first()

    

    friends = []
    for friend in session.friends:
        friends.append(friend.id)
    
    return json.dumps({"status" : True, "name" : session.name, "friends" : friends, "email" : session.email, "updated" : user.updated, "id" : session.id})


@mod_auth.route('/logout/<cookie>', methods=['GET'])
@crossdomain(origin='*')
def logout(cookie):
    session = Session.query.filter_by(cookie=cookie).first()
    if session:
        db.session.delete(session)
        db.session.commit()
    return json.dumps({"status" : True})


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
    user.commentsTaggedIn.append(comment)
    db.session.commit()
    return str("Comment added")


@mod_auth.route('/loadComment/', methods=['GET','POST'])
@crossdomain(origin='*')
def loadComment():
    user = User.query.filter_by(id=request.args.get('userID')).first()
    url = request.args.get('url')
    comments = []
    for comment in user.commentsTaggedIn:
        if comment.url == url:
            comments.append((comment.string, comment.numLikes, comment.time, comment.user.name.split(" ")[0]))

    comments = sorted(comments, reverse=True, key=lambda c : c[2])



    templateData = {
        
        'comments' : comments
        
    }

    return render_template('auth/popup.html', **templateData)




    





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

