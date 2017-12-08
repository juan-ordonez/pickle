from flask import Flask
from flask_login import UserMixin
from app import db
import hashlib
from sqlalchemy.orm import relationship
from random import randint



tags_table = db.Table('tags_table', db.Model.metadata,
    db.Column('user_id', db.String(128), db.ForeignKey('auth_user.id')),
    db.Column('comment_id', db.String(128), db.ForeignKey('auth_comment.id')), 
)

session_table = db.Table('session_table', db.Model.metadata,
    db.Column('user_id', db.String(128), db.ForeignKey('auth_user.id')),
    db.Column('session_cookie', db.String(1024), db.ForeignKey('auth_session.cookie'))
)

likes_table = db.Table('likes_table', db.Model.metadata,
    db.Column('user_id', db.String(128), db.ForeignKey('auth_user.id')),
    db.Column('comment_id', db.String(128), db.ForeignKey('auth_comment.id'))
)

browsing_table = db.Table('browsing_table', db.Model.metadata,
    db.Column('user_id', db.String(128), db.ForeignKey('auth_user.id')),
    db.Column('url_id', db.String(1024), db.ForeignKey('auth_url.id'))
)

mentions_table = db.Table('mentions_table', db.Model.metadata,
    db.Column('user_id', db.String(128), db.ForeignKey('auth_user.id')),
    db.Column('comment_id', db.String(128), db.ForeignKey('auth_comment.id')),
    mysql_charset='utf8',
)




class User(UserMixin, db.Model):
	__tablename__ = 'auth_user'

	id = db.Column(db.String(128), primary_key=True)
	name = db.Column(db.String(128))
	email = db.Column(db.String(128))
	picture = db.Column(db.String(512))
	updated = db.Column(db.Boolean)
	notifications = db.relationship("Notification", backref="user", lazy='dynamic')
	numNotifications = db.Column(db.Integer)
	commentsWritten = db.relationship("Comment", backref="user", lazy='dynamic')
	commentsTaggedIn = db.relationship("Comment", secondary=tags_table, lazy='dynamic', backref=db.backref('usersTagged', lazy='dynamic'))
	browsingData = db.relationship("URL", secondary=browsing_table, backref=db.backref('users', lazy='dynamic'))
	friendSession = db.relationship("Session", secondary=session_table, backref=db.backref('friends', lazy='dynamic'))
	likes = db.relationship("Comment", secondary=likes_table, backref=db.backref('likers', lazy='dynamic'))
	commentsMentionedIn = db.relationship("Comment", secondary=mentions_table, backref=db.backref('mentions', lazy='dynamic'))
	newsfeed = db.relationship("Feed", backref="user", lazy='dynamic')


	
	def __init__(self, id, name, email, picture):
		self.id = id
		self.name = name
		self.email = email
		self.updated = False
		self.picture = picture
		self.numNotifications = 0



class Comment(db.Model):
	__tablename__ = 'auth_comment'

	id = db.Column(db.String(128), primary_key=True)
	string = db.Column(db.String(256))
	url = db.Column(db.String(512))
	time = db.Column(db.String(128))
	public = db.Column(db.Boolean)
	user_id = db.Column(db.String(128), db.ForeignKey('auth_user.id'))
	numLikes = db.Column(db.Integer)


	
	def __init__(self, string, url, time):
		self.string = string
		self.url = url
		self.time = time
		self.public = False
		hashed = hashlib.sha1()
		unique = str(url) + str(string) + str(time)
		hashed.update(unique.encode('utf-8'))
		self.id = str(hashed)
		self.numLikes = 0


class Session(db.Model):
	__tablename__ = 'auth_session'

	cookie = db.Column(db.String(1024), primary_key=True)
	id = db.Column(db.String(128))
	name = db.Column(db.String(128))
	email = db.Column(db.String(128))
	authToken = db.Column(db.String(1024))


	
	def __init__(self, cookie, id, name, email):
		self.cookie = cookie
		self.id = id
		self.name = name
		self.email = email

class Notification(db.Model):
	__tablename__ = 'auth_notification'

	id = db.Column(db.String(1024), primary_key=True)
	name = db.Column(db.String(128))
	time = db.Column(db.String(512))
	message = db.Column(db.String(256))
	picture = db.Column(db.String(1024))
	url = db.Column(db.String(512))
	page = db.Column(db.String(512))
	user_id = db.Column(db.String(128), db.ForeignKey('auth_user.id'))


	
	def __init__(self, name, time, message, picture, url):
		self.name = name
		self.time = time
		self.message = message
		self.picture = picture
		self.url = url
		hashed = hashlib.sha1()
		unique = str(name) + str(time) + str(message) + str(picture)
		hashed.update(unique.encode('utf-8'))
		self.id = str(hashed)



class URL(db.Model):
	__tablename__ = 'auth_url'

	id = db.Column(db.String(1024), primary_key=True)
	string = db.Column(db.String(1024))
	time = db.Column(db.String(512))


	
	def __init__(self, time, string):
		self.string = string
		self.time = time
		hashed = hashlib.sha1()
		unique = str(string) + str(time)
		hashed.update(unique.encode('utf-8'))
		self.id = str(hashed)



class Feed(db.Model):
	__tablename__ = 'auth_feed'
	__table_args__ = {'mysql_charset': 'utf8'}

	id = db.Column(db.String(128), primary_key=True)
	tagType = db.Column(db.String(128))
	time = db.Column(db.String(128))
	title = db.Column(db.String(512))
	image = db.Column(db.String(256))
	description = db.Column(db.String(256))
	message = db.Column(db.String(256))
	url = db.Column(db.String(512))
	user_id = db.Column(db.String(128), db.ForeignKey('auth_user.id'))



	
	def __init__(self, tagType, time, title, image, description, message, url):
		self.tagType = tagType
		self.time = time
		self.title = title
		self.image = image
		self.description = description
		self.message = message
		self.url = url
		hashed = hashlib.sha1()
		unique = str(tagType) + str(time) + str(title) + str(image) + str(description) + str(message) + str(url)
		hashed.update(unique.encode('utf-8'))
		self.id = str(hashed)








	
	




	
       
