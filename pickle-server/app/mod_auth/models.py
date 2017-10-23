from flask import Flask
from flask_login import UserMixin
from app import db
import hashlib
from sqlalchemy.orm import relationship
from random import randint



tags_table = db.Table('association', db.Model.metadata,
    db.Column('user_id', db.String(64), db.ForeignKey('auth_user.id')),
    db.Column('comment_id', db.String(64), db.ForeignKey('auth_comment.id'))
)



class User(UserMixin, db.Model):
	__tablename__ = 'auth_user'

	id = db.Column(db.String(64), primary_key=True)
	name = db.Column(db.String(128))
	email = db.Column(db.String(128))
	commentsWritten = db.relationship("Comment", backref="user", lazy='dynamic')
	commentsTaggedIn = db.relationship("Comment", secondary=tags_table, backref=db.backref('usersTagged', lazy='dynamic'))


	
	def __init__(self, id, name, email):
		self.id = id
		self.name = name
		self.email = email



class Comment(db.Model):
	__tablename__ = 'auth_comment'

	id = db.Column(db.String(64), primary_key=True)
	string = db.Column(db.String(128))
	url = db.Column(db.String(128))
	time = db.Column(db.String(128))
	user_id = db.Column(db.String(64), db.ForeignKey('auth_user.id'))
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
	




	
       
