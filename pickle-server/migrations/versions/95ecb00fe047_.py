"""empty message

Revision ID: 95ecb00fe047
Revises: 1e0b3a94f2d6
Create Date: 2017-12-28 01:34:13.353258

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = '95ecb00fe047'
down_revision = '1e0b3a94f2d6'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column("auth_comment", sa.Column("group_id", mysql.VARCHAR(length=128), nullable=True))
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('auth_feed',
    sa.Column('id', mysql.VARCHAR(length=128), nullable=False),
    sa.Column('poster_id', mysql.VARCHAR(length=128), nullable=True),
    sa.Column('time', mysql.VARCHAR(length=128), nullable=True),
    sa.Column('title', mysql.VARCHAR(length=512), nullable=True),
    sa.Column('image', mysql.VARCHAR(length=256), nullable=True),
    sa.Column('description', mysql.VARCHAR(length=256), nullable=True),
    sa.Column('message', mysql.VARCHAR(length=256), nullable=True),
    sa.Column('url', mysql.VARCHAR(length=512), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    mysql_default_charset=u'utf8',
    mysql_engine=u'InnoDB'
    )
    op.create_table('mentions_table',
    sa.Column('user_id', mysql.VARCHAR(length=128), nullable=True),
    sa.Column('comment_id', mysql.VARCHAR(length=128), nullable=True),
    sa.ForeignKeyConstraint(['comment_id'], [u'auth_comment.id'], name=u'mentions_table_ibfk_2'),
    sa.ForeignKeyConstraint(['user_id'], [u'auth_user.id'], name=u'mentions_table_ibfk_1'),
    mysql_default_charset=u'utf8',
    mysql_engine=u'InnoDB'
    )
    op.create_table('auth_session',
    sa.Column('cookie', mysql.VARCHAR(length=1024), nullable=False),
    sa.Column('id', mysql.VARCHAR(length=128), nullable=True),
    sa.Column('name', mysql.VARCHAR(length=128), nullable=True),
    sa.Column('email', mysql.VARCHAR(length=128), nullable=True),
    sa.Column('authToken', mysql.VARCHAR(length=1024), nullable=True),
    sa.PrimaryKeyConstraint('cookie'),
    mysql_default_charset=u'utf8',
    mysql_engine=u'InnoDB'
    )
    op.create_table('tags_table',
    sa.Column('user_id', mysql.VARCHAR(length=128), nullable=True),
    sa.Column('comment_id', mysql.VARCHAR(length=128), nullable=True),
    sa.ForeignKeyConstraint(['comment_id'], [u'auth_comment.id'], name=u'tags_table_ibfk_2'),
    sa.ForeignKeyConstraint(['user_id'], [u'auth_user.id'], name=u'tags_table_ibfk_1'),
    mysql_default_charset=u'utf8',
    mysql_engine=u'InnoDB'
    )
    op.create_table('browsing_table',
    sa.Column('user_id', mysql.VARCHAR(length=128), nullable=True),
    sa.Column('url_id', mysql.VARCHAR(length=1024), nullable=True),
    sa.ForeignKeyConstraint(['url_id'], [u'auth_url.id'], name=u'browsing_table_ibfk_2'),
    sa.ForeignKeyConstraint(['user_id'], [u'auth_user.id'], name=u'browsing_table_ibfk_1'),
    mysql_default_charset=u'utf8',
    mysql_engine=u'InnoDB'
    )
    op.create_table('auth_notification',
    sa.Column('id', mysql.VARCHAR(length=1024), nullable=False),
    sa.Column('name', mysql.VARCHAR(length=128), nullable=True),
    sa.Column('time', mysql.VARCHAR(length=512), nullable=True),
    sa.Column('message', mysql.VARCHAR(length=256), nullable=True),
    sa.Column('picture', mysql.VARCHAR(length=1024), nullable=True),
    sa.Column('url', mysql.VARCHAR(length=512), nullable=True),
    sa.Column('user_id', mysql.VARCHAR(length=128), nullable=True),
    sa.Column('page', mysql.VARCHAR(length=512), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], [u'auth_user.id'], name=u'auth_notification_ibfk_1'),
    sa.PrimaryKeyConstraint('id'),
    mysql_default_charset=u'utf8',
    mysql_engine=u'InnoDB'
    )
    op.create_table('auth_url',
    sa.Column('id', mysql.VARCHAR(length=1024), nullable=False),
    sa.Column('string', mysql.VARCHAR(length=1024), nullable=True),
    sa.Column('time', mysql.VARCHAR(length=512), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    mysql_default_charset=u'utf8',
    mysql_engine=u'InnoDB'
    )
    op.create_table('feed_table',
    sa.Column('user_id', mysql.VARCHAR(length=128), nullable=True),
    sa.Column('feed_id', mysql.VARCHAR(length=128), nullable=True),
    sa.ForeignKeyConstraint(['feed_id'], [u'auth_feed.id'], name=u'feed_table_ibfk_2'),
    sa.ForeignKeyConstraint(['user_id'], [u'auth_user.id'], name=u'feed_table_ibfk_1'),
    mysql_default_charset=u'utf8',
    mysql_engine=u'InnoDB'
    )
    op.create_table('user_groups_table',
    sa.Column('user_id', mysql.VARCHAR(length=128), nullable=True),
    sa.Column('group_id', mysql.VARCHAR(length=128), nullable=True),
    sa.ForeignKeyConstraint(['group_id'], [u'auth_group.id'], name=u'user_groups_table_ibfk_2'),
    sa.ForeignKeyConstraint(['user_id'], [u'auth_user.id'], name=u'user_groups_table_ibfk_1'),
    mysql_default_charset=u'utf8',
    mysql_engine=u'InnoDB'
    )
    op.create_table('auth_user',
    sa.Column('id', mysql.VARCHAR(length=128), nullable=False),
    sa.Column('name', mysql.VARCHAR(length=128), nullable=True),
    sa.Column('email', mysql.VARCHAR(length=128), nullable=True),
    sa.Column('picture', mysql.VARCHAR(length=512), nullable=True),
    sa.Column('updated', mysql.TINYINT(display_width=1), autoincrement=False, nullable=True),
    sa.Column('numNotifications', mysql.INTEGER(display_width=11), autoincrement=False, nullable=True),
    sa.PrimaryKeyConstraint('id'),
    mysql_default_charset=u'utf8',
    mysql_engine=u'InnoDB'
    )
    op.create_table('session_table',
    sa.Column('user_id', mysql.VARCHAR(length=128), nullable=True),
    sa.Column('session_cookie', mysql.VARCHAR(length=1024), nullable=True),
    sa.ForeignKeyConstraint(['session_cookie'], [u'auth_session.cookie'], name=u'session_table_ibfk_2'),
    sa.ForeignKeyConstraint(['user_id'], [u'auth_user.id'], name=u'session_table_ibfk_1'),
    mysql_default_charset=u'utf8',
    mysql_engine=u'InnoDB'
    )
    op.create_table('auth_comment',
    sa.Column('id', mysql.VARCHAR(length=128), nullable=False),
    sa.Column('string', mysql.VARCHAR(length=256), nullable=True),
    sa.Column('url', mysql.VARCHAR(length=512), nullable=True),
    sa.Column('time', mysql.VARCHAR(length=128), nullable=True),
    sa.Column('user_id', mysql.VARCHAR(length=128), nullable=True),
    sa.Column('numLikes', mysql.INTEGER(display_width=11), autoincrement=False, nullable=True),
    sa.Column('public', mysql.TINYINT(display_width=1), autoincrement=False, nullable=True),
    sa.ForeignKeyConstraint(['user_id'], [u'auth_user.id'], name=u'auth_comment_ibfk_1'),
    sa.PrimaryKeyConstraint('id'),
    mysql_default_charset=u'utf8',
    mysql_engine=u'InnoDB'
    )
    op.create_table('likes_table',
    sa.Column('user_id', mysql.VARCHAR(length=128), nullable=True),
    sa.Column('comment_id', mysql.VARCHAR(length=128), nullable=True),
    sa.ForeignKeyConstraint(['comment_id'], [u'auth_comment.id'], name=u'likes_table_ibfk_2'),
    sa.ForeignKeyConstraint(['user_id'], [u'auth_user.id'], name=u'likes_table_ibfk_1'),
    mysql_default_charset=u'utf8',
    mysql_engine=u'InnoDB'
    )
    op.create_table('feed_tags_table',
    sa.Column('user_id', mysql.VARCHAR(length=128), nullable=True),
    sa.Column('feed_id', mysql.VARCHAR(length=128), nullable=True),
    sa.ForeignKeyConstraint(['feed_id'], [u'auth_feed.id'], name=u'feed_tags_table_ibfk_2'),
    sa.ForeignKeyConstraint(['user_id'], [u'auth_user.id'], name=u'feed_tags_table_ibfk_1'),
    mysql_default_charset=u'utf8',
    mysql_engine=u'InnoDB'
    )
    op.create_table('auth_group',
    sa.Column('id', mysql.VARCHAR(length=128), nullable=False),
    sa.Column('time', mysql.VARCHAR(length=128), nullable=True),
    sa.Column('name', mysql.VARCHAR(length=256), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    mysql_default_charset=u'utf8',
    mysql_engine=u'InnoDB'
    )
    # ### end Alembic commands ###
