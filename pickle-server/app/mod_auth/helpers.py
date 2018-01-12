import metadata_parser
from datetime import datetime
from dateutil import tz
from app.mod_auth.models import User, Comment, Session, tags_table, Notification, URL, Feed, Group
from app import db
import ujson as json

"""For a given URL, retrieve HTML and look for potential canonical URL. 
   Returns canonical URL if found, or regular URL otherwise"""
def canonical(url):
	try:
		headers = {'User-Agent':'Mozilla/5.0'}
		page = metadata_parser.MetadataParser(url=url, url_headers=headers)
		canonical = page.get_metadata('canonical')

		if canonical:
			return canonical
		return url
	except:
		return url

def getPostDescription(userID, posterID, tagsArray, friendsArray):

    userName = ""
    friendNames = ""
    strangerNames = ""

    # try:
    #Sort tagsArray, friends first then strangers
    taggedFriends = []
    taggedStrangers = []
    for tag in tagsArray:
        if tag in friendsArray:
            #taggedFriends.append(tag.name)
            taggedFriends.append(tag)
        elif tag != userID:
            #taggedStrangers.append(tag.name)
            taggedStrangers.append(tag)
    taggedNames = taggedFriends + taggedStrangers

    tagCount = len(taggedNames)
    tagsLeft = tagCount - len(taggedNames[:4])

    #If user is poster
    if userID == posterID: 
        stranger = False
        author = True
        if tagCount < 5:
            if tagCount == 0:
                postDescription = "You yipped this page"
            elif tagCount == 1:
                postDescription = "You tagged " + taggedNames[0]
            elif tagCount == 2:
                postDescription = "You tagged " + (" and ").join(taggedNames)
            else:
                postDescription = "You tagged " + (', ').join(taggedNames[:-1]) + ' and ' + taggedNames[-1]
        else:
            postDescription = "You tagged " + (', ').join(taggedNames[:4]) + " and " +str(tagsLeft)+ " other people"

    #If poster is user's friend
    elif posterID in friendsArray:
        stranger = False
        author = False
        if userID in tagsArray:
            taggedNames.insert(0, "you")
            tagCount += 1
            tagsLeft += 1
        if tagCount < 5:
            if tagCount == 0:
                postDescription = posterID + " yipped this page"
            elif tagCount == 1:
                postDescription = posterID +" tagged "+ taggedNames[0]
            elif tagCount == 2:
                postDescription = posterID + " tagged " + (" and ").join(taggedNames)
            else:
                postDescription = posterID + " tagged " + (', ').join(taggedNames[:-1]) + ' and ' + taggedNames[-1]
        else:
            postDescription = posterID + " tagged " + (', ').join(taggedNames[:4]) + ' and ' + str(tagsLeft) + " other people"
    #If poster is stranger to user
    else:
        stranger = True
        author = False
        if userID in tagsArray:
            taggedNames.insert(0, "You")
            tagCount += 1
            tagsLeft += 1
        if tagCount < 5:
            if tagCount == 0:
                postDescription = posterID + " yipped this page"
            elif taggedNames[0] == "You" and tagCount == 1:
                postDescription = "You were tagged by "+posterID  
            elif tagCount == 1:
                if taggedNames[0]:
                    postDescription = "You were tagged by "+posterID  
                postDescription = taggedNames[0] +" was tagged by "+posterID
            elif tagCount == 2:
                postDescription = (" and ").join(taggedNames) + " were tagged by " + posterID 
            else:
                postDescription = (', ').join(taggedNames[:-1]) + ' and ' + taggedNames[-1]+ " were tagged by " + posterID
        else:
            postDescription = (', ').join(taggedNames[:4]) + ' and ' + str(tagsLeft)+ " other people were tagged by " + posterID

    otherPeople = taggedNames[4:]

    return [postDescription, otherPeople, stranger, author]

    # except:
    #     print(error)
    #     return [posterID +" commented on a page", "error"]

# juan = "Juan Ordonez"
# josh = "Josh Goldman"
# alex = "Alex Zekoff"
# clay = "Clay Anthony"
# gagan = "Gagan Mac"
# michael = "Michael Chai"
# hannah = "Hannah Chi"
# tucker = "Tucker Smith"
# anne = "Anne Flan"
# brad = "Brad Pitt"

# getPostDescription("<a class='userProfile' href=# id=10155273220258655>Juan Ordonez</a>", "<a class='userProfile' href=# id=107087570064503>Juan Yipp</a>", [], ["<a class='userProfile' href=# id=10156851155369899>Dhruv Madaan</a>", "<a class='userProfile' href=# id=167049900552950>Alexander Zapata</a>", "<a class='userProfile' href=# id=10214918996198053>Briana Advani</a>", "<a class='userProfile' href=# id=1749276548424629>Shannon Finley</a>", "<a class='userProfile' href=# id=10105729742621685>Clay Anthony</a>", "<a class='userProfile' href=# id=10159543159390072>Roman Gutierrez Correa</a>", "<a class='userProfile' href=# id=1348321891962814>Laila Zouaki</a>", "<a class='userProfile' href=# id=10155876843455842>Cody Alan Yanna</a>", "<a class='userProfile' href=# id=167049900552950>Alexander Zapata</a>", "<a class='userProfile' href=# id=167049900552950>Alexander Zapata</a>", "<a class='userProfile' href=# id=10105729742621685>Clay Anthony</a>", "<a class='userProfile' href=# id=10104242717591808>Alex Zekoff</a>", "<a class='userProfile' href=# id=10105729742621685>Clay Anthony</a>", "<a class='userProfile' href=# id=10156851155369899>Dhruv Madaan</a>", "<a class='userProfile' href=# id=10104242717591808>Alex Zekoff</a>", "<a class='userProfile' href=# id=10214316183321507>Patrick Taube</a>", "<a class='userProfile' href=# id=10155957240195555>Benoit Habfast</a>", "<a class='userProfile' href=# id=10214316183321507>Patrick Taube</a>", "<a class='userProfile' href=# id=10210546058836225>Juan Felipe Ordonez</a>", "<a class='userProfile' href=# id=10155957240195555>Benoit Habfast</a>", "<a class='userProfile' href=# id=10212016016289493>Paul Chatelain</a>", "<a class='userProfile' href=# id=10155957240195555>Benoit Habfast</a>", "<a class='userProfile' href=# id=10214316183321507>Patrick Taube</a>", "<a class='userProfile' href=# id=10104242717591808>Alex Zekoff</a>", "<a class='userProfile' href=# id=10105729742621685>Clay Anthony</a>", "<a class='userProfile' href=# id=10156851155369899>Dhruv Madaan</a>", "<a class='userProfile' href=# id=10212329316162489>Himanshu Sahay</a>", "<a class='userProfile' href=# id=10159543159390072>Roman Gutierrez Correa</a>", "<a class='userProfile' href=# id=10155862710817402>Tanner Barnes</a>", "<a class='userProfile' href=# id=10159543159390072>Roman Gutierrez Correa</a>", "<a class='userProfile' href=# id=10155049664248807>Ruxandra Duc\u0103</a>", "<a class='userProfile' href=# id=10104242717591808>Alex Zekoff</a>", "<a class='userProfile' href=# id=10104242717591808>Alex Zekoff</a>", "<a class='userProfile' href=# id=10104242717591808>Alex Zekoff</a>", "<a class='userProfile' href=# id=10104242717591808>Alex Zekoff</a>", "<a class='userProfile' href=# id=167049900552950>Alexander Zapata</a>", "<a class='userProfile' href=# id=10159543159390072>Roman Gutierrez Correa</a>", "<a class='userProfile' href=# id=10104242717591808>Alex Zekoff</a>", "<a class='userProfile' href=# id=10105729742621685>Clay Anthony</a>", "<a class='userProfile' href=# id=10104242717591808>Alex Zekoff</a>", "<a class='userProfile' href=# id=167049900552950>Alexander Zapata</a>", "<a class='userProfile' href=# id=10155862710817402>Tanner Barnes</a>", "<a class='userProfile' href=# id=10155049664248807>Ruxandra Duc\u0103</a>", "<a class='userProfile' href=# id=10154748823792315>Kliment Minchev</a>", "<a class='userProfile' href=# id=10105729742621685>Clay Anthony</a>", "<a class='userProfile' href=# id=10104242717591808>Alex Zekoff</a>", "<a class='userProfile' href=# id=167049900552950>Alexander Zapata</a>", "<a class='userProfile' href=# id=10105729742621685>Clay Anthony</a>", "<a class='userProfile' href=# id=1719382084762838>Trevor Voth</a>", "<a class='userProfile' href=# id=10156851155369899>Dhruv Madaan</a>", "<a class='userProfile' href=# id=10159543159390072>Roman Gutierrez Correa</a>", "<a class='userProfile' href=# id=10159543159390072>Roman Gutierrez Correa</a>", "<a class='userProfile' href=# id=167049900552950>Alexander Zapata</a>", "<a class='userProfile' href=# id=10155049664248807>Ruxandra Duc\u0103</a>", "<a class='userProfile' href=# id=10104242717591808>Alex Zekoff</a>", "<a class='userProfile' href=# id=1529209823828694>Ethan Wells</a>", "<a class='userProfile' href=# id=10156851155369899>Dhruv Madaan</a>", "<a class='userProfile' href=# id=10155862710817402>Tanner Barnes</a>", "<a class='userProfile' href=# id=10155049664248807>Ruxandra Duc\u0103</a>", "<a class='userProfile' href=# id=10104242717591808>Alex Zekoff</a>", "<a class='userProfile' href=# id=10105729742621685>Clay Anthony</a>", "<a class='userProfile' href=# id=1749276548424629>Shannon Finley</a>", "<a class='userProfile' href=# id=10159543159390072>Roman Gutierrez Correa</a>", "<a class='userProfile' href=# id=167049900552950>Alexander Zapata</a>", "<a class='userProfile' href=# id=10155876843455842>Cody Alan Yanna</a>", "<a class='userProfile' href=# id=10214918996198053>Briana Advani</a>", "<a class='userProfile' href=# id=10211224416434502>Josh Goldman</a>", "<a class='userProfile' href=# id=10211224416434502>Josh Goldman</a>", "<a class='userProfile' href=# id=10211224416434502>Josh Goldman</a>", "<a class='userProfile' href=# id=10211224416434502>Josh Goldman</a>", "<a class='userProfile' href=# id=10211224416434502>Josh Goldman</a>", "<a class='userProfile' href=# id=10211224416434502>Josh Goldman</a>", "<a class='userProfile' href=# id=10211224416434502>Josh Goldman</a>", "<a class='userProfile' href=# id=10214316183321507>Patrick Taube</a>", "<a class='userProfile' href=# id=10211224416434502>Josh Goldman</a>", "<a class='userProfile' href=# id=10211224416434502>Josh Goldman</a>", "<a class='userProfile' href=# id=10211224416434502>Josh Goldman</a>", "<a class='userProfile' href=# id=10211224416434502>Josh Goldman</a>", "<a class='userProfile' href=# id=1918399404842008>Elliott Wiegman</a>", "<a class='userProfile' href=# id=10155957240195555>Benoit Habfast</a>", "<a class='userProfile' href=# id=10104242717591808>Alex Zekoff</a>", "<a class='userProfile' href=# id=10155202473145922>Andrew Beaupre</a>", "<a class='userProfile' href=# id=10211224416434502>Josh Goldman</a>", "<a class='userProfile' href=# id=10211224416434502>Josh Goldman</a>", "<a class='userProfile' href=# id=10211224416434502>Josh Goldman</a>", "<a class='userProfile' href=# id=10211224416434502>Josh Goldman</a>"])


# Converts a string in datetime object format (YYYY-MM-DD 00:00:00.000000) 
# into a string with proper timestamp label
def getTimeLabel(commentDatetime):
    #Convert comment datetime from utc to user's local timezone
    localTimeZone = tz.tzlocal()
    UtcTimeZone = tz.tzutc()
    commentTimeAware = datetime.strptime(commentDatetime, "%Y-%m-%d %H:%M:%S.%f")
    commentTimeAware = commentTimeAware.replace(tzinfo=UtcTimeZone)
    commentTimeAware = commentTimeAware.astimezone(localTimeZone)
    commentDatetime = str(commentTimeAware)
    #Get current datetime in [year,month,day,hour, minute] format
    currentDatetime = str(datetime.now())
    currentTime = [int(currentDatetime[0:4]), int(currentDatetime[5:7]), int(currentDatetime[8:10]), int(currentDatetime[11:13]), int(currentDatetime[14:16])]
    #Get comment datetime in [year, month,day,hour, minute] format
    commentTime = [int(commentDatetime[0:4]), int(commentDatetime[5:7]), int(commentDatetime[8:10]), int(commentDatetime[11:13]), int(commentDatetime[14:16])]

    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    #Format time string
    if currentTime[0] == commentTime[0] and currentTime[1] == commentTime[1] and currentTime[2] == commentTime[2] and currentTime[3] == commentTime[3]:
        timeDifference = currentTime[4] - commentTime[4]
        timeLabel = str(timeDifference) + " min"
    elif  currentTime[0] == commentTime[0] and currentTime[1] == commentTime[1] and currentTime[2] == commentTime[2]:
        if currentTime[4] - commentTime[4] >= 30:
            timeDifference = currentTime[3] - commentTime[3] + 1
        else:
            timeDifference = currentTime[3] - commentTime[3]
        timeLabel = str(timeDifference) + "hrs"
    elif currentTime[0] == commentTime[0]:
        if commentTime[3] <12:
            timeLabel = str(months[commentTime[1] - 1]) +" "+ str(commentTime[2]) + ", " + str(commentTime[3]) + ":" + str(commentTime[4]) + " AM"
        else:
            timeLabel = str(months[commentTime[1] - 1]) +" "+ str(commentTime[2]) + ", " + str(commentTime[3]-12) + ":" + str(commentTime[4]) + " PM"
    else:
        if commentTime[3] <12:
            timeLabel = str(months[commentTime[1] - 1]) +" "+ str(commentTime[2]) +" "+ str(commentTime[0]) + ", " + str(commentTime[3]) + ":" + str(commentTime[4]) + " AM"
        else:
            timeLabel = str(months[commentTime[1] - 1]) +" "+ str(commentTime[2]) +" "+ str(commentTime[0]) +", " + str(commentTime[3]-12) + ":" + str(commentTime[4]) + " PM"

    return timeLabel


def friendsOfFriendsHelper(groupID, userID, comment, feed):
    
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
        group1 = Group.query.filter_by(id=user.id).first()
        members = group1.users


    added = set()
    for member in members:
        if member != user:
            print(member.id)
            added.add(member)
            generalFriend = Group.query.filter_by(id=member.id).first()
            if generalFriend:
                generalFriend.comments.append(comment)
                generalFriend.posts.append(feed)
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