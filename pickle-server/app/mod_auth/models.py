from flask import Flask
from flask_login import UserMixin
from app import db
import hashlib
from sqlalchemy.orm import relationship
from random import randint



tags_table = db.Table('tags_table', db.Model.metadata,
    db.Column('user_id', db.String(128), db.ForeignKey('auth_user.id')),
    db.Column('comment_id', db.String(128), db.ForeignKey('auth_comment.id')), 
    db.Column('liked', db.Boolean)
)

session_table = db.Table('session_table', db.Model.metadata,
    db.Column('user_id', db.String(128), db.ForeignKey('auth_user.id')),
    db.Column('session_cookie', db.String(1024), db.ForeignKey('auth_session.cookie'))
)



class User(UserMixin, db.Model):
	__tablename__ = 'auth_user'

	id = db.Column(db.String(128), primary_key=True)
	name = db.Column(db.String(128))
	email = db.Column(db.String(128))
	picture = db.Column(db.String(512))
	updated = db.Column(db.Boolean)
	commentsWritten = db.relationship("Comment", backref="user", lazy='dynamic')
	commentsTaggedIn = db.relationship("Comment", secondary=tags_table, backref=db.backref('usersTagged', lazy='dynamic'))
	friendSession = db.relationship("Session", secondary=session_table, backref=db.backref('friends', lazy='dynamic'))


	
	def __init__(self, id, name, email, picture):
		self.id = id
		self.name = name
		self.email = email
		self.updated = False
		self.picture = picture



class Comment(db.Model):
	__tablename__ = 'auth_comment'

	id = db.Column(db.String(128), primary_key=True)
	string = db.Column(db.String(128))
	url = db.Column(db.String(512))
	time = db.Column(db.String(128))
	user_id = db.Column(db.String(128), db.ForeignKey('auth_user.id'))
	numLikes = db.Column(db.Integer)


	
	def __init__(self, string, url, time):
		self.string = string
		self.url = url
		self.time = time
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


	
	




	
       
