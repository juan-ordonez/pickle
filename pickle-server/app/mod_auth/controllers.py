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
from app.mod_auth.models import User, Comment, Session, tags_table, Notification, URL, Feed, Group

from flask_login import LoginManager, login_user, login_required, logout_user, current_user, user_logged_in, current_user
from flask_optimize import FlaskOptimize

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
from helpers import canonical, getTimeLabel, getPostDescription, friendsOfFriendsHelper

credentials = GoogleCredentials.get_application_default()

instagram_access_token = '22061997.f474111.9666e524ddb140608d124b554fb8bda0'
facebook_access_token = '1430922756976623|b9CHdj7HQEPluzKIqZosLTnTaJQ'
google_places_access_token = 'AIzaSyAokrPlw45fd-jNzarVz09OPNVXRB2kdTg'



mod_auth = Blueprint('auth', __name__, url_prefix='')

flask_optimize = FlaskOptimize()


instaConfig = {

    'client_id': 'f47411163bd6493bae1667a70e793fb5',
    'client_secret': '76b892dd1f054d9fba7afcdc2c5d7f18',
    'redirect_uri' : 'https://damp-cliffs-30092.herokuapp.com/auth/instagram_callback'

}
api = InstagramAPI(**instaConfig)

@mod_auth.route('/login/', methods=['GET', 'POST'])
@crossdomain(origin='*')
@flask_optimize.optimize()
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
@flask_optimize.optimize('json')
def register():
    data = json.loads(request.form['json'])

    if data['status']:
        
        user = User.query.filter_by(id=data['id']).first()


        email = None
        if 'email' in data.keys():
            email = data['email']

        if user:
            user.updated = True
            group = Group.query.filter_by(id=user.id).first()
            if not group:
                group = Group("General", str(datetime.utcnow()))
                group.id = user.id
                db.session.add(group)
                group.users.append(user)
            if user not in group.users:
                group.users.append(user)


        else:
            create = User(data['id'], data['name'], email, data['picture'])
            create.updated = True
            group = Group.query.filter_by(id=create.id).first()
            if not group:
                group = Group("General", str(datetime.utcnow()))
                group.id = create.id
                db.session.add(group)
                group.users.append(create)
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
@flask_optimize.optimize('json')
def user(cookie):
    session = Session.query.filter_by(cookie=cookie).first()
    if not session:
        return json.dumps({"status" : False})


    user = User.query.filter_by(id=session.id).first()

    groups = []
    for group in user.groups:
        groups.append(group.id)

    

    friends = []
    for friend in session.friends:
        friends.append((friend.id, friend.name, friend.picture))
    
    return json.dumps({"status" : True, "name" : session.name, "friends" : friends, "email" : session.email, "updated" : user.updated, "id" : session.id, "picture" : user.picture, "notifications" : user.numNotifications, "groups" : groups})


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
@flask_optimize.optimize('json')
def comment():
    url = canonical(request.form['url'])
    comment = Comment(request.form['string'], url, str(datetime.utcnow()))
    comment.public = request.form['public']
    user = User.query.filter_by(id=request.form['userId']).first()
    user.commentsWritten.append(comment)
    db.session.add(user)
    db.session.add(comment)
    tags = ast.literal_eval(str(request.form['tags']))
    comment.mentions.append(user)
    posts = set([])


    if not comment.public:
        for tag in tags:
            taggedUser = User.query.filter_by(id=tag).first()
            taggedUser.commentsTaggedIn.append(comment)
            comment.mentions.append(taggedUser)
    else:
        publicFriends = set([])
        if request.form['pageDescription'] and request.form['pageTitle'] and request.form['pageImage']:
            # feed = Feed(user.name + " commented on a page", str(datetime.now()), request.form['pageTitle'], request.form['pageImage'], 
            #                 request.form['pageDescription'], user.name.split(" ")[0] + ': ' + request.form['string'], url)
            feed = Feed(user.id, str(datetime.utcnow()), request.form['pageTitle'], request.form['pageImage'], 
                            request.form['pageDescription'], user.name.split(" ")[0] + ': ' + request.form['string'], url)
            db.session.add(feed)
        else:
            feed = None


        

        
        groupId = request.form['groupID']
        
        group1 = Group.query.filter_by(id=groupId).first()
        general = Group.query.filter_by(id=user.id).first()
        if group1:
            group1.comments.append(comment)
        general.comments.append(comment)
        if feed:
            if group1:
                group1.posts.append(feed)
            general.posts.append(feed)
            # friendsOfFriends(members, user, group1, comment, feed)

        
        #Add post and comment to user
        # user.commentsTaggedIn.append(comment)
        # if feed:
        #     user.newsfeed.append(feed)
        #     feed.tags.append(user)
        publicFriends.add(user.id)

        #Add post and comment to friends of user (excluding those tagged in comment)
        # for session in user.friendSession:
        #     friendUser = User.query.filter_by(id=session.id).first()
        #     if friendUser.id not in publicFriends and friendUser.id not in tags:
        #         friendUser.commentsTaggedIn.append(comment)
        #         if feed:
        #             friendUser.newsfeed.append(feed)
        #         publicFriends.add(friendUser.id)

        #Add post and comment to users tagged in comment
        if len(tags) > 0:
            for tag in tags:
                taggedUser = User.query.filter_by(id=tag).first()
                # comment.mentions.append(taggedUser)
                if taggedUser.id not in publicFriends:
                    taggedUser.commentsTaggedIn.append(comment)
                #     if feed:
                #         taggedUser.newsfeed.append(feed)
                #         feed.tags.append(taggedUser)
                    publicFriends.add(taggedUser.id)

                taggedSessions = Session.query.filter_by(id=tag).all()
                for session in taggedSessions:
                    if session.authToken and session.id != user.id:
                        posts.add(session.authToken)
                
                for session in taggedUser.friendSession:
                    if session.id not in publicFriends and session.id not in tags:
                        friendGeneral = Group.query.filter_by(id=session.id).first()
                        if friendGeneral:
                            friendGeneral.comments.append(comment)
                            if feed:
                                friendGeneral.posts.append(feed)
                        publicFriends.add(session.id)





    user.commentsTaggedIn.append(comment)
    db.session.commit()



    friends = set([])
    friendsOfFriendsSet = set([])
    for session in user.friendSession:
        if session.authToken and session.id != user.id:
            friends.add(session.authToken)
        friendOfFriend = User.query.filter_by(id=session.id).first()
        friendGeneral = Group.query.filter_by(id=friendOfFriend.id).first()
        if friendGeneral:
            if comment and comment not in friendGeneral.comments:
                friendGeneral.comments.append(comment)
            if feed and feed not in friendGeneral.posts:
                friendGeneral.posts.append(feed)

        for friendsession in friendOfFriend.friendSession:
            if friendsession.authToken and friendsession.id not in friendsOfFriendsSet:
                friendsOfFriendsSet.add(friendsession.id)
    db.session.commit()

    if feed:
        return json.dumps([json.dumps(list(friends)), json.dumps(list(posts)), groupId, user.id, comment.id, feed.id, json.dumps(list(friendsOfFriendsSet))])
    else:
        return json.dumps([json.dumps(list(friends)), json.dumps(list(posts)), groupId, user.id, comment.id, None, json.dumps(list(friendsOfFriendsSet))])


@mod_auth.route('/loadComment/', methods=['GET','POST'])
@crossdomain(origin='*')
@flask_optimize.optimize('json')
def loadComment():
    user = User.query.filter_by(id=request.form['userID']).first()
    url = request.form['url']
    
    #Get IDs of friends of user
    friends = set([])
    for session in user.friendSession:
        if session.authToken:
            friends.add(session.id)
    jsonData = {}
    jsonData["url"] = url
    groups = []
    for group in user.groups:
        if group.id == user.id:
            groups.append(("general", group.comments))
        else:
            groups.append((group.id, group.comments))

    for group in groups:
        comments = []
        #For each comment that the user has been tagged on
        for comment in group[1].filter_by(url=url):

            #Append data of comment to comments array
            comments.append((comment.string, comment.numLikes, comment.time, comment.user.name.split(" ")[0], comment.user.picture, urllib.quote(comment.id), getTimeLabel(comment.time), user in comment.likers, comment.user.id))

        comments = sorted(comments, reverse=False, key=lambda c : c[2])

        templateData = {
            
            'comments' : comments
            
        }


        jsonData[group[0]] = render_template('auth/popup.html', **templateData)

    return json.dumps(jsonData)


@mod_auth.route('/like/', methods=['POST'])
@crossdomain(origin='*')
@flask_optimize.optimize()
def like():
    comment = Comment.query.filter_by(id=request.form['commentID']).first()
    user = User.query.filter_by(id=request.form['userID']).first()
    comment.numLikes += 1
    comment.likers.append(user)
    db.session.commit()
    return str("liked")


@mod_auth.route('/unlike/', methods=['POST'])
@crossdomain(origin='*')
@flask_optimize.optimize()
def unlike():
    comment = Comment.query.filter_by(id=request.form['commentID']).first()
    user = User.query.filter_by(id=request.form['userID']).first()
    comment.numLikes -= 1
    comment.likers.remove(user)
    db.session.commit()
    return str("unliked")


@mod_auth.route('/token/', methods=['POST'])
@crossdomain(origin='*')
@flask_optimize.optimize()
def token():
    session = Session.query.filter_by(cookie=request.form['session']).first()
    if session:
        token = request.form['token']
        session.authToken = token
        db.session.commit()
    return str("token added")



@mod_auth.route('/friendsarray/<user>', methods=['GET'])
@crossdomain(origin='*')
@flask_optimize.optimize('json')
def friends(user):
    friends = set([])
    user = User.query.filter_by(id=user).first()
    for session in user.friendSession:
        if session.authToken:
            friends.add(session.authToken)
    
    return json.dumps(list(friends))



@mod_auth.route('/domainComments', methods=['GET', 'POST'])
@crossdomain(origin='*')
@flask_optimize.optimize()
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
@flask_optimize.optimize('json')
def commentUser(id):
    info = {}
    comment = Comment.query.filter_by(id=id).first()
    user = comment.user
    info['picture'] = user.picture
    info['first'] = user.name.split(' ')[0]
    info['url'] = comment.url
    info['id'] = user.id
    sessions = Session.query.filter_by(name=user.name).first()
    ids = set()
    for session in sessions:
        ids.add(session.authToken)

    info['ids'] = list(ids)
    return json.dumps(info)


@mod_auth.route('/notification/', methods=['GET','POST'])
@crossdomain(origin='*')
@flask_optimize.optimize()
def notification():
    
    cookies = ast.literal_eval(str(request.form['cookies']))
    for cookie in cookies:
        user = User.query.filter_by(id=cookie).first()
        
        #Create notification with page title field set to empty by default

        notification = Notification(request.form['user'], str(datetime.utcnow()), request.form['notification'], request.form['picture'], canonical(request.form['url']))
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
@flask_optimize.optimize()
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
@flask_optimize.optimize()
def reset():
    user = User.query.filter_by(id=request.form['id']).first()
    user.numNotifications = 0
    db.session.commit()
    return "reset"


@mod_auth.route('/friends/', methods=['GET','POST'])
@crossdomain(origin='*')
@flask_optimize.optimize()
def friendsList():
    friends = []
    if request.form['direct']:
        direct = True
    else:
        direct = False
    user = User.query.filter_by(id=request.form['id']).first()
    ids = ast.literal_eval(str(request.form['friends']))
    for friend in ids:
        user = User.query.filter_by(id=friend).first()
        friends.append((friend, user.name))
    templateData = {
        'friends' : sorted(friends, key=lambda c : c[1]),
        'direct' : direct
    }

    return render_template('auth/friends.html', **templateData)



@mod_auth.route('/friendstokens/', methods=['GET','POST'])
@crossdomain(origin='*')
@flask_optimize.optimize('json')
def friendsTokens():
    friends = set([])
    ids = ast.literal_eval(str(request.form['friends']))
    for friend in ids:
        sessions = Session.query.filter_by(id=friend).first()
        for session in sessions:
            if session.authToken:
                friends.add(session.authToken)
    

    return json.dumps(list(friends))



@mod_auth.route('/canonicalize/', methods=['POST'])
@crossdomain(origin='*')
@flask_optimize.optimize("text")
def canonicalize():
    url = request.form['url']
    url = canonical(url)
    

    return url



@mod_auth.route('/history/', methods=['POST'])
@crossdomain(origin='*')
@flask_optimize.optimize()
def history():
    url = canonical(request.form['url'])
    userID = request.form['user']

    user = User.query.filter_by(id=userID).first()

    if user:
        history = URL.query.filter_by(string=url).filter_by(time=datetime.utcnow()).first()
        if history and history not in user.browsingData:
            user.browsingData.append(history)
        else:
            history = URL(str(datetime.utcnow()), url)
            user.browsingData.append(history)
            db.session.add(history)
        db.session.commit()

    return "browsing data added"



@mod_auth.route('/loadPosts/', methods=['GET','POST'])
@crossdomain(origin='*')
@flask_optimize.optimize()
def loadPosts():
    posts = []
    user = User.query.filter_by(id=request.form['id']).first()
    groupID = request.form['groupID']
    if groupID == "general":
        print("THE GENERAL")
        groupFeed = Group.query.filter_by(id=user.id).first().posts
    else:
        groupFeed = Group.query.filter_by(id=groupID).first().posts      
    
    for post in groupFeed:
        parsed_uri = urlparse(post.url)
        domain = '{uri.scheme}://{uri.netloc}/'.format(uri=parsed_uri)
        poster = User.query.filter_by(id=post.poster_id).first()
        
        #format usernames of user and poster
        userName = "<a class='userProfile' href=# id="+user.id+">"+user.name+"</a>"
        posterName = "<a class='userProfile' href=# id="+poster.id+">"+poster.name+"</a>"

        #Get names of friends of user
        friends = []
        for session in user.friendSession:
            if session.authToken:
                friends.append("<a class='userProfile' href=# id="+session.id+">"+session.name+"</a>")

        #Get names of users tagged in post
        tags = []

        for tag in post.tags:
            if tag.id != poster.id:
                tags.append("<a class='userProfile' href=# id="+tag.id+">"+tag.name+"</a>")

        postDescription = getPostDescription(userName, posterName, tags, friends)

        posts.append((urllib.quote(post.id), postDescription[0], post.time, post.title, post.image, post.description, post.message, post.url, domain, poster.picture, post.id, postDescription[3]))
    

    posts = sorted(posts, reverse=True, key=lambda c : c[2])
    templateData = {
        'posts' : posts
        
    }
    return render_template('auth/newsfeed.html', **templateData)



# @mod_auth.route('/loadPostsProfile/', methods=['GET','POST'])
# @crossdomain(origin='*')
# @flask_optimize.optimize()
# def loadPostsProfile():
#     posts = []
#     user = User.query.filter_by(id=request.form['id']).first()
    
#     for post in user.newsfeed:
#         poster = User.query.filter_by(id=post.poster_id).first()
#         if user in post.tags or user==poster:
#             parsed_uri = urlparse(post.url)
#             domain = '{uri.scheme}://{uri.netloc}/'.format(uri=parsed_uri)
            
#             #format usernames of user and poster
#             userName = "<a class='userProfile' href=# id="+user.id+">"+user.name+"</a>"
#             posterName = "<a class='userProfile' href=# id="+poster.id+">"+poster.name+"</a>"

#             #Get names of friends of user
#             friends = []
#             for session in user.friendSession:
#                 if session.authToken:
#                     friends.append("<a class='userProfile' href=# id="+session.id+">"+session.name+"</a>")

#             #Get names of users tagged in post
#             tags = []

#             for tag in post.tags:
#                 if tag.id != poster.id:
#                     tags.append("<a class='userProfile' href=# id="+tag.id+">"+tag.name+"</a>")

#             postDescription = getPostDescription(userName, posterName, tags, friends)

#             posts.append((urllib.quote(post.id), postDescription[0], post.time, post.title, post.image, post.description, post.message, post.url, domain, poster.picture, post.id, postDescription[3]))
        

#     posts = sorted(posts, reverse=True, key=lambda c : c[2])
#     templateData = {
#         'posts' : posts
        
#     }
#     return render_template('auth/profile.html', **templateData)


# @mod_auth.route('/loadPostsUser/', methods=['GET','POST'])
# @crossdomain(origin='*')
# @flask_optimize.optimize()
# def loadPostsUser():
#     profile = User.query.filter_by(id=request.form['profileID']).first()
#     posts = []
#     user = User.query.filter_by(id=request.form['id']).first()
    
#     for post in user.newsfeed:
#         poster = User.query.filter_by(id=post.poster_id).first()
#         if profile in post.tags or profile==poster:
#             parsed_uri = urlparse(post.url)
#             domain = '{uri.scheme}://{uri.netloc}/'.format(uri=parsed_uri)
            
#             #format usernames of user and poster
#             userName = "<a class='userProfile' href=# id="+user.id+">"+user.name+"</a>"
#             posterName = "<a class='userProfile' href=# id="+poster.id+">"+poster.name+"</a>"

#             #Get names of friends of user
#             friends = []
#             for session in user.friendSession:
#                 if session.authToken:
#                     friends.append("<a class='userProfile' href=# id="+session.id+">"+session.name+"</a>")

#             #Get names of users tagged in post
#             tags = []

#             for tag in post.tags:
#                 if tag.id != poster.id:
#                     tags.append("<a class='userProfile' href=# id="+tag.id+">"+tag.name+"</a>")

#             postDescription = getPostDescription(userName, posterName, tags, friends)

#             posts.append((urllib.quote(post.id), postDescription[0], post.time, post.title, post.image, post.description, post.message, post.url, domain, poster.picture, post.id, postDescription[3]))
        

#     posts = sorted(posts, reverse=True, key=lambda c : c[2])
#     templateData = {
#         'posts' : posts,
#         'userName' : profile.name,
#         'userPic' : profile.picture
        
#     }
#     return render_template('auth/userProfile.html', **templateData)

@mod_auth.route('/createGroup/', methods=['POST', 'GET'])
@crossdomain(origin='*')
@flask_optimize.optimize()
def createGroup():

    name = request.form['name']
    group = Group(name, str(datetime.utcnow()))
    if request.form['direct']:
        group.direct = True 
    else:
        group.direct = False
    users = ast.literal_eval(str(request.form['users']))
    if not name:
        group.name = ",".join(users)
    db.session.add(group)

    friends = ast.literal_eval(str(request.form['ids']))
    for friend in friends:
        user = User.query.filter_by(id=friend).first()
        group.users.append(user)
    user = User.query.filter_by(id=request.form['id']).first()
    if user not in group.users:
        group.users.append(user)
    db.session.commit()

    return group.id


@mod_auth.route('/groupNames/', methods=['GET','POST'])
@crossdomain(origin='*')
@flask_optimize.optimize()
def groupNames():
    groups = []
    direct = []
    user = User.query.filter_by(id=request.form['id']).first()
    for group in user.groups:
        if group.id != user.id:
            if user.name in group.name and group.direct:
                split = group.name.split(',')
                split.remove(user.name)
                name = ",".join(split)
            else:
                name = group.name
            if group.direct:
                direct.append((group.id, name))
            else:
                groups.append((group.id, name))
    templateData = {
        'groups' : groups,
        'direct' : direct
    }

    return render_template('auth/groups.html', **templateData)


@mod_auth.route('/getGroups/', methods=['GET','POST'])
@crossdomain(origin='*')
@flask_optimize.optimize('json')
def getGroups():
    groups = []
    user = User.query.filter_by(id=request.form['id']).first()
    for group in user.groups: 
        groups.append(group.id)

    return json.dumps(list(groups))


@mod_auth.route('/getNotificationsDict/', methods=['GET','POST'])
@crossdomain(origin='*')
@flask_optimize.optimize('json')
def getNotificationsDict():
    user = User.query.filter_by(id=request.args.get('id')).first()

    notif = {}
    if not user.notificationsDictString:
        for group in user.groups:
            notif[group.id] = 0
        return notif
    else:
        return json.loads(user.notificationsDictString)



@mod_auth.route('/postNotificationsDict/', methods=['GET','POST'])
@crossdomain(origin='*')
@flask_optimize.optimize()
def postNotificationsDict():
    user = User.query.filter_by(id=request.form['id']).first()
    data = request.form['json']
    print(data)

    user.notificationsDictString = data

    db.session.commit()
    

    return "posted"


@mod_auth.route('/loadGroupData/', methods=['GET','POST'])
@crossdomain(origin='*')
@flask_optimize.optimize('json')
def loadGroupData():
    user = User.query.filter_by(id=request.form['id']).first()
    jsonData = {}
    groups = []
    for group in user.groups:
        users = []
        #For each comment that the user has been tagged on
        for i in group.users:
            #Append data of comment to comments array
            if i != user:
                users.append((i.id, i.name, i.picture))


        templateData = {
            
            'users' : users
            
        }


        jsonData[group.id] = render_template('auth/groupInfo.html', **templateData)

    return json.dumps(jsonData)


@mod_auth.route('/leaveGroup/', methods=['GET','POST'])
@crossdomain(origin='*')
@flask_optimize.optimize('json')
def leaveGroup():
    info = {}
    ids = set()
    user = User.query.filter_by(id=request.form['id']).first()
    group = Group.query.filter_by(id=request.form['currentGroup']).first()
    for member in group.users:
        if member != user:
            session = Session.query.filter_by(id=member.id).first()
            ids.add(session.authToken)
    if group.direct:
        group.users = []
    else:
        group.users.remove(user)
    db.session.commit()

    info['ids'] = list(ids)
    return json.dumps(info)



@mod_auth.route('/friendsOfFriends/', methods=['GET','POST'])
@crossdomain(origin='*')
@flask_optimize.optimize('text')
def friendsOfFriends():
    groupID = request.form['groupID']
    userID = request.form['userID']
    comment = request.form['comment']
    feed = request.form['feed']
    user = User.query.filter_by(id=userID).first()
    comment = Comment.query.filter_by(id=comment).first()
    feed = Feed.query.filter_by(id=feed).first()
    userFriends = set()
    for session in user.friendSession:
        friendUser = User.query.filter_by(id=session.id).first()
        if friendUser not in userFriends:
            userFriends.add(friendUser)
    if groupID == "general":
        members = userFriends
    else:
        group1 = Group.query.filter_by(id=groupID).first()
        members = group1.users


    added = set()
    sessionsSet = set()
    for member in members:
        if member != user:
            added.add(member)
            generalFriend = Group.query.filter_by(id=member.id).first()
            if generalFriend:
                generalFriend.comments.append(comment)
                generalFriend.posts.append(feed)
            else:
                newGroup = Group("General", str(datetime.utcnow()))
                newGroup.id = member.id
                db.session.add(newGroup)
                newGroup.users.append(member)
                newGroup.comments.append(comment)
                newGroup.posts.append(feed)
            sessions = Session.query.filter_by(id=member.id).all()
            for session in sessions:
                if session.authToken:
                    sessionsSet.add(session.authToken)

            # for session in member.friendSession:
            #     friendUser = User.query.filter_by(id=session.id).first()
            #     if friendUser not in added and friendUser != user:
            #         added.add(friendUser)
            #         friendGeneral = Group.query.filter_by(id=friendUser.id).first()
            #         if friendGeneral:
            #             friendGeneral.comments.append(comment)
            #             friendGeneral.posts.append(feed)

            if member.notificationsDictString:
                notificationsJSON = json.loads(member.notificationsDictString)
                if groupID not in notificationsJSON.keys():
                    notificationsJSON[groupID] = 1
                else:
                    notificationsJSON[groupID] += 1
                member.notificationsDictString = json.dumps(notificationsJSON)
            else:
                notificationsDictString = {}
                notificationsDictString[groupID] = 1
                member.notificationsDictString = json.dumps(notificationsDictString)
    db.session.commit()
    return json.dumps(list(sessionsSet))    


    

    



    

