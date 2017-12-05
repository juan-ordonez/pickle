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
from urlparse import urlparse
import operator

# Import module forms
from app.mod_auth.forms import LoginForm, RegistrationForm, RemoveForm

# Import module models (i.e. User)
from app.mod_auth.models import User, Comment, Session, tags_table, Notification, URL

from flask_login import LoginManager, login_user, login_required, logout_user, current_user, user_logged_in, current_user

from run import login_manager

from instagram.client import InstagramAPI
from BeautifulSoup import BeautifulSoup


from collections import Counter
from datetime import datetime

from sqlalchemy import and_
from sqlalchemy.sql import update

import ujson as json
import argparse

from google.cloud import language
from google.cloud.language import enums
from google.cloud.language import types
from oauth2client.client import GoogleCredentials
from twilio.twiml.voice_response import Reject, VoiceResponse, Say, Dial, Number
import ast
from selenium import webdriver
from helpers import canonical, getTimeLabel

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


        email = None
        if 'email' in data.keys():
            email = data['email']

        if user:
            user.updated = True

        else:
            create = User(data['id'], data['name'], email, data['picture'])
            create.updated = True
            for friend in data['friends']:
                friendObject = User.query.filter_by(id=friend['id']).first()
                if friendObject:
                    sessions = Session.query.filter_by(id=friendObject.id).all()
                    for session in sessions:
                        session.friends.append(create)
                    friendObject.updated = True
                    for comment in friendObject.commentsWritten:
                        if comment.public:
                            create.commentsTaggedIn.append(comment)

        
            db.session.add(create)

        if 'authToken' in data.keys():
            session = Session.query.filter_by(cookie=data['authToken']).first()
            if not session:
                session = Session(data['authToken'], data['id'], data['name'], email)
                db.session.add(session)

        else:
            session = Session.query.filter_by(cookie=request.cookies["fbsr_1430922756976623"]).first()
            if not session:
                session = Session(request.cookies["fbsr_1430922756976623"], data['id'], data['name'], email)
                db.session.add(session)
        
        
        if data['friends']:
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
    
    return json.dumps({"status" : True, "name" : session.name, "friends" : friends, "email" : session.email, "updated" : user.updated, "id" : session.id, "picture" : user.picture, "notifications" : user.numNotifications})


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
    comment = Comment(request.form['string'], canonical(request.form['url']), str(datetime.now()))
    comment.public = request.form['public']
    user = User.query.filter_by(id=request.form['userId']).first()
    user.commentsWritten.append(comment)
    db.session.add(user)
    db.session.add(comment)
    tags = ast.literal_eval(str(request.form['tags']))
    if not comment.public:
        for tag in tags:
            taggedUser = User.query.filter_by(id=tag).first()
            taggedUser.commentsTaggedIn.append(comment)
    else:
        publicFriends = set([])
        for tag in tags:
            taggedUser = User.query.filter_by(id=tag).first()
            if taggedUser.id not in publicFriends:
                taggedUser.commentsTaggedIn.append(comment)
                publicFriends.add(taggedUser.id)
            for session in taggedUser.friendSession:
                if session.id not in publicFriends:
                    friend = User.query.filter_by(id=session.id).first()
                    friend.commentsTaggedIn.append(comment)
                    publicFriends.add(session.id)
        for session in user.friendSession:
            friendUser = User.query.filter_by(id=session.id).first()
            if friendUser.id not in publicFriends:
                friendUser.commentsTaggedIn.append(comment)
                publicFriends.add(taggedUser.id)



    user.commentsTaggedIn.append(comment)
    db.session.commit()



    friends = set([])
    for session in user.friendSession:
        if session.authToken and session.id in tags:
            friends.add(session.authToken)
    
    return json.dumps(list(friends))


@mod_auth.route('/loadComment/', methods=['GET','POST'])
@crossdomain(origin='*')
def loadComment():
    user = User.query.filter_by(id=request.form['userID']).first()
    url = canonical(request.form['url'])
    
    #Get IDs of friends of user
    friends = set([])
    for session in user.friendSession:
        if session.authToken:
            friends.add(session.id)
    

    comments = []
    #For each comment that the user has been tagged on
    for comment in user.commentsTaggedIn:
        # If the url of the comment matches the current url that the user is on
        if comment.url == url:
            #Get names and IDs of all user's friends also tagged in the comment
            tagNames = []
            tagIds = []
            for tag in comment.usersTagged:
                if tag.id in friends or tag.id == user.id:
                    tagNames.append(tag.name)
                    tagIds.append(tag.id)
            #Convert list of friends tagged into string
            tagNamesString = '@' + ', @'.join(sorted(tagNames))
            tagIdsString = '-'.join(sorted(tagIds))
            if not comment.public:
                css = "private"
            else:
                css="";
            #Append data of comment to comments array
            comments.append((comment.string, comment.numLikes, comment.time, comment.user.name.split(" ")[0], comment.user.picture, urllib.quote(comment.id), tagIdsString, tagNamesString, getTimeLabel(comment.time), css, user in comment.likers))

    comments = sorted(comments, reverse=False, key=lambda c : c[2])

    templateData = {
        
        'comments' : comments
        
    }

    return render_template('auth/popup.html', **templateData)


@mod_auth.route('/like/', methods=['POST'])
@crossdomain(origin='*')
def like():
    comment = Comment.query.filter_by(id=request.form['commentID']).first()
    user = User.query.filter_by(id=request.form['userID']).first()
    comment.numLikes += 1
    comment.likers.append(user)
    db.session.commit()
    return str("liked")


@mod_auth.route('/unlike/', methods=['POST'])
@crossdomain(origin='*')
def unlike():
    comment = Comment.query.filter_by(id=request.form['commentID']).first()
    user = User.query.filter_by(id=request.form['userID']).first()
    comment.numLikes -= 1
    comment.likers.remove(user)
    db.session.commit()
    return str("unliked")


@mod_auth.route('/token/', methods=['POST'])
@crossdomain(origin='*')
def token():
    session = Session.query.filter_by(cookie=request.form['session']).first()
    if session:
        token = request.form['token']
        session.authToken = token
        db.session.commit()
    return str("token added")



@mod_auth.route('/friendsarray/<user>', methods=['GET'])
@crossdomain(origin='*')
def friends(user):
    friends = set([])
    user = User.query.filter_by(id=user).first()
    for session in user.friendSession:
        if session.authToken:
            friends.add(session.authToken)
    
    return json.dumps(list(friends))



@mod_auth.route('/domainComments', methods=['GET', 'POST'])
@crossdomain(origin='*')
def domain():
    comments = {}
    user = User.query.filter_by(id=request.form['user']).first()
    url = request.form['url']
    parsed_uri = urlparse(url)
    domain = '{uri.scheme}://{uri.netloc}/'.format(uri=parsed_uri)
    for comment in user.commentsTaggedIn:
        if domain in comment.url and comment.url != url:
            soup = BeautifulSoup(urllib.urlopen(comment.url))
            new = str(soup.title.string)
            if len(new) > 16:
                new = new[:16] + '...'
            if new not in comments.keys():
                comments[new] = [1, url, comment.url]
            else:
                comments[new][0] += 1

    urls = []
    for comment in comments.keys():
        urls.append((comment, comments[comment][0], comments[comment][1], comments[comment][2]))
    sortedComments = sorted(urls, key=lambda c: c[1], reverse=True)
    templateData = {
        'comments' : sortedComments
        
    }
    return render_template('auth/domain.html', **templateData)



@mod_auth.route('/commentUser/<id>', methods=['GET'])
@crossdomain(origin='*')
def commentUser(id):
    info = {}
    comment = Comment.query.filter_by(id=id).first()
    user = comment.user
    info['picture'] = user.picture
    info['first'] = user.name.split(' ')[0]
    info['url'] = comment.url
    info['id'] = user.id
    sessions = Session.query.filter_by(name=user.name).all()
    ids = set()
    for session in sessions:
        ids.add(session.authToken)

    info['ids'] = list(ids)
    return json.dumps(info)


@mod_auth.route('/notification/', methods=['GET','POST'])
@crossdomain(origin='*')
def notification():
    
    cookies = ast.literal_eval(str(request.form['cookies']))
    for cookie in cookies:
        user = User.query.filter_by(id=cookie).first()
        
        #Create notification with page title field set to empty by default

        notification = Notification(request.form['user'], str(datetime.now()), request.form['notification'], request.form['picture'], canonical(request.form['url']))
        #If the request from background.js contains a title page, update the field in notification
        if request.form['page']:
            page = request.form['page']
            page = page.encode('utf-8')
            notification.page = page
        db.session.add(notification)
        notification.user = user
        user.numNotifications += 1
        
        db.session.add(user)
        db.session.commit()
    
    return "done"



@mod_auth.route('/loadnotifications/', methods=['GET','POST'])
@crossdomain(origin='*')
def loadnotifications():
    notifications = []
    user = User.query.filter_by(id=request.form['id']).first()
    for notification in user.notifications:
        notifications.append((urllib.quote(notification.id), notification.name, notification.time, notification.message, notification.picture, notification.url, notification.page))
    

    comments = sorted(notifications, reverse=True, key=lambda c : c[2])
    templateData = {
        'notifications' : comments
        
    }
    return render_template('auth/notifications.html', **templateData)


@mod_auth.route('/reset', methods=['POST'])
@crossdomain(origin='*')
def reset():
    user = User.query.filter_by(id=request.form['id']).first()
    user.numNotifications = 0
    db.session.commit()
    return "reset"


@mod_auth.route('/friends/', methods=['GET','POST'])
@crossdomain(origin='*')
def friendsList():
    friends = []
    user = User.query.filter_by(id=request.form['id']).first()
    ids = ast.literal_eval(str(request.form['friends']))
    for friend in ids:
        user = User.query.filter_by(id=friend).first()
        friends.append((friend, user.name))
    templateData = {
        'friends' : sorted(friends, key=lambda c : c[1])
    }

    return render_template('auth/friends.html', **templateData)



@mod_auth.route('/friendstokens/', methods=['GET','POST'])
@crossdomain(origin='*')
def friendsTokens():
    friends = set([])
    ids = ast.literal_eval(str(request.form['friends']))
    for friend in ids:
        sessions = Session.query.filter_by(id=friend).all()
        for session in sessions:
            if session.authToken:
                friends.add(session.authToken)
    

    return json.dumps(list(friends))



@mod_auth.route('/canonicalize/', methods=['POST'])
@crossdomain(origin='*')
def canonicalize():
    url = request.form['url']
    url = canonical(url)
    

    return url



@mod_auth.route('/history/', methods=['POST'])
@crossdomain(origin='*')
def history():
    url = canonical(request.form['url'])
    userID = request.form['user']

    user = User.query.filter_by(id=userID).first()

    if user:
        history = URL.query.filter_by(string=url).filter_by(time=datetime.now()).first()
        if history and history not in user.browsingData:
            user.browsingData.append(history)
        else:
            history = URL(str(datetime.now()), url)
            user.browsingData.append(history)
            db.session.add(history)
        db.session.commit()

    return "browsing data added"









    

