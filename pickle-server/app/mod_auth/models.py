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
	commentsWritten = db.relationship("Comment", backref="user", lazy='dynamic')
	commentsTaggedIn = db.relationship("Comment", secondary=tags_table, backref=db.backref('usersTagged', lazy='dynamic'))


	
	def __init__(self, id):
		self.id = id




class Comment(db.Model):
	__tablename__ = 'auth_comment'

	id = db.Column(db.String(64), primary_key=True)
	string = db.Column(db.String(128))
	url = db.Column(db.String(128))
	time = db.Column(db.Float)
	user_id = db.Column(db.String(64), db.ForeignKey('auth_user.id'))


	
	def __init__(self, id, string, url, time):
		self.string = string
		self.url = url
		self.time = time
		hashed = hashlib.sha1()
		unique = str(url) + str(string) + str(time)
		hashed.update(unique.encode('utf-8'))
		self.id = str(hashed)
	




	
       
